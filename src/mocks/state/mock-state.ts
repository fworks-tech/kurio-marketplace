/**
 * Centralized mock state store for the NFT Marketplace.
 *
 * Maintains application-wide mock state that persists across
 * MSW handlers and test scenarios. Provides reset utility
 * to restore initial state.
 *
 * @module mocks/state
 * @see src/shared/api/api-types - Types consumed by state
 * @see src/mocks/fixtures/index.ts - Initial fixture data source
 * @see src/mocks/browser.ts - Browser initialization
 * @see src/mocks/server.ts - Test server initialization
 *
 * State structure:
 * - nfts: Available, sold-out, and empty catalog states
 * - users: Authenticated and anonymous user scenarios
 * - cart: Current cart state with items and totals
 * - favorites: User-specific favorite NFTs
 * - orders: Active and completed orders
 * - session: Active authentication session
 */

import type {
  NftSummary,
  UserSummary,
  CartItem,
  CartQuote,
  OrderSummary,
  NftUpdatedEvent,
  OrderUpdatedEvent,
  PaginationParams,
  Wallet
} from '../../shared/api/api-types'
import { toMicro, fromMicro, multiplyMoney } from '../../shared/api/money'
import { nftAvailable, nftSoldOut, userAlice, userBob } from '../fixtures/index'

/** Mock state interface - all mutable state managed by MSW */
export interface MockState {
  /** Current authenticated user (or null for anonymous) */
  user: UserSummary | null

  /** Current user's cart items */
  cart: CartItem[]

  /** User's favorite NFT IDs */
  favorites: string[]

  /** Catalog NFTs - available items */
  nfts: NftSummary[]

  /** Sold-out NFTs (filtered from catalog) */
  nftsSoldOut: NftSummary[]

  /** Empty catalog flag */
  nftsEmpty: boolean

  /** Active order (if any) */
  order: OrderSummary | null

  /** Current authentication session */
  session: {
    isAuthenticated: boolean
    accessToken: string | null
    refreshToken: string | null
    expiresAt: string | null
  }

  /** Pagination state for catalog queries */
  pagination: PaginationParams

  /** Metadata about last API calls */
  meta: {
    lastRequest: string | null
    requestCount: number
    error: string | null
  }
}

/** Idempotency records keyed by client Idempotency-Key for replay vs conflict */
export interface IdempotencyRecord {
  /** Network the order was placed on (part of the request intent) */
  network: string
  /** Coupon code applied (part of the request intent) */
  couponCode: string | null
  /** Snapshot hash of the cart captured at creation, for replay detection */
  cartHash: string
  order: OrderSummary
}

/** Pending orders keyed by idempotency key for idempotency support */
export const idempotencyKeys = new Map<string, IdempotencyRecord>()

/** Persisted orders keyed by order id */
export const orderStore: Map<string, OrderSummary> = new Map()

/** Generated quotes keyed by quote id; each quote carries its own timestamps */
export const quoteStore: Map<string, CartQuote> = new Map()

/** Internal account record. Mock password storage, never a real secret. */
export interface MockAccount {
  user: UserSummary
  email: string
  password: string
}

const SESSION_STORAGE_KEY = 'nft-mock-session'

/**
 * Deterministic non-reversible mock password hash.
 *
 * README forbids storing passwords in clear. This is intentionally NOT a
 * security hash (no salt, no cost) - it only keeps the fictitious mock seed
 * from holding literal passwords. Real credential hashing belongs to a real
 * backend, which this simulation has none of.
 */
export function hashPassword(value: string): string {
  let h = 5381
  for (let i = 0; i < value.length; i += 1) {
    h = ((h * 33) ^ value.charCodeAt(i)) >>> 0
  }
  return `mock$${h.toString(36)}`
}

const MOCK_PASSWORD = hashPassword('password123')

function seedAccounts(): Map<string, MockAccount> {
  return new Map([
    ['alice@example.com', { user: userAlice, email: 'alice@example.com', password: MOCK_PASSWORD }],
    ['bob@example.com', { user: userBob, email: 'bob@example.com', password: MOCK_PASSWORD }]
  ])
}

export const mockAccounts: Map<string, MockAccount> = seedAccounts()

export function findAccountByEmail(email: string): MockAccount | undefined {
  return mockAccounts.get(email.trim().toLowerCase())
}

/** Login accepts either the email or the username, matching the sign-in modal. */
export function findAccountByLogin(login: string): MockAccount | undefined {
  const value = login.trim().toLowerCase()
  return (
    mockAccounts.get(value) ??
    [...mockAccounts.values()].find((account) => account.user.username.toLowerCase() === value)
  )
}

export function addAccount(account: MockAccount): void {
  mockAccounts.set(account.email.trim().toLowerCase(), account)
}

function resetAccounts(): void {
  mockAccounts.clear()
  for (const [email, account] of seedAccounts()) {
    mockAccounts.set(email, account)
  }
}

export const MAX_QUANTITY_PER_NFT = 5

const ANONYMOUS_CART_KEY = 'anonymous'
const CART_STORAGE_KEY = 'nft-mock-carts'
const cartStore = new Map<string, CartItem[]>()
let activeCartKey = ANONYMOUS_CART_KEY

function getActiveCartKey(): string {
  return currentState.user ? `user:${currentState.user.id}` : ANONYMOUS_CART_KEY
}

function persistCarts(): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(Object.fromEntries(cartStore)))
}

function hydratePersistedCarts(): void {
  if (typeof localStorage === 'undefined') return
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY)
    if (!raw) {
      cartStore.set(ANONYMOUS_CART_KEY, [])
      return
    }
    const parsed = JSON.parse(raw) as Record<string, CartItem[]>
    for (const [key, items] of Object.entries(parsed)) {
      if (Array.isArray(items)) {
        cartStore.set(key, items)
      }
    }
    if (!cartStore.has(ANONYMOUS_CART_KEY)) {
      cartStore.set(ANONYMOUS_CART_KEY, [])
    }
  } catch {
    localStorage.removeItem(CART_STORAGE_KEY)
    cartStore.set(ANONYMOUS_CART_KEY, [])
  }
}

function clearPersistedCarts(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(CART_STORAGE_KEY)
  }
}

function saveActiveCart(): void {
  cartStore.set(activeCartKey, currentState.cart)
  persistCarts()
}

function switchCartForUser(): void {
  cartStore.set(activeCartKey, currentState.cart)
  const nextKey = getActiveCartKey()

  if (nextKey !== ANONYMOUS_CART_KEY) {
    const anonymous = cartStore.get(ANONYMOUS_CART_KEY) ?? []
    if (anonymous.length > 0) {
      const userCart = cartStore.get(nextKey) ?? []
      for (const item of anonymous) {
        const existing = userCart.find((entry) => entry.nftId === item.nftId)
        if (existing) {
          existing.quantity = Math.min(
            existing.quantity + item.quantity,
            MAX_QUANTITY_PER_NFT
          )
          existing.total = multiplyMoney(existing.price, existing.quantity)
        } else {
          userCart.push(structuredClone(item))
        }
      }
      cartStore.set(nextKey, userCart)
      cartStore.set(ANONYMOUS_CART_KEY, [])
    }
  }

  activeCartKey = nextKey
  currentState.cart = cartStore.get(nextKey) ?? []
  persistCarts()
}

function refreshCartPrices(): void {
  currentState.cart = currentState.cart.map((item) => {
    const nft =
      currentState.nfts.find((entry) => entry.id === item.nftId) ??
      currentState.nftsSoldOut.find((entry) => entry.id === item.nftId)
    if (!nft) return item
    return {
      ...item,
      nft,
      price: nft.price,
      total: multiplyMoney(nft.price, item.quantity)
    }
  })
  saveActiveCart()
}

const FAVORITES_STORAGE_KEY = 'nft-mock-favorites'
const favoriteStore = new Map<string, string[]>()
let activeFavoritesKey: string | null = null

function getActiveFavoritesKey(): string | null {
  return currentState.user ? `user:${currentState.user.id}` : null
}

function persistFavorites(): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(Object.fromEntries(favoriteStore)))
}

function hydratePersistedFavorites(): void {
  if (typeof localStorage === 'undefined') return
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as Record<string, string[]>
    for (const [key, ids] of Object.entries(parsed)) {
      if (Array.isArray(ids)) favoriteStore.set(key, ids)
    }
  } catch {
    localStorage.removeItem(FAVORITES_STORAGE_KEY)
  }
}

function clearPersistedFavorites(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(FAVORITES_STORAGE_KEY)
  }
}

function persistActiveFavorites(): void {
  if (!activeFavoritesKey) return
  favoriteStore.set(activeFavoritesKey, currentState.favorites)
  persistFavorites()
}

function switchFavoritesForUser(): void {
  if (activeFavoritesKey) {
    favoriteStore.set(activeFavoritesKey, currentState.favorites)
  }
  activeFavoritesKey = getActiveFavoritesKey()
  currentState.favorites = activeFavoritesKey ? favoriteStore.get(activeFavoritesKey) ?? [] : []
  persistFavorites()
}

const WALLET_STORAGE_KEY = 'nft-mock-wallets'
const walletStore = new Map<string, Wallet[]>()
let walletIdSequence = 0

function persistWallets(): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(Object.fromEntries(walletStore)))
}

function hydratePersistedWallets(): void {
  if (typeof localStorage === 'undefined') return
  try {
    const raw = localStorage.getItem(WALLET_STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as Record<string, Wallet[]>
    for (const [userId, wallets] of Object.entries(parsed)) {
      if (Array.isArray(wallets)) walletStore.set(userId, wallets)
    }
  } catch {
    localStorage.removeItem(WALLET_STORAGE_KEY)
  }
}

function clearPersistedWallets(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(WALLET_STORAGE_KEY)
  }
}

function ensureWallets(): Wallet[] {
  const user = currentState.user
  if (!user) return []
  const existing = walletStore.get(user.id)
  if (existing) return existing

  const seeded: Wallet[] = [
    {
      id: 'wallet-primary',
      address: user.address,
      label: 'Primary Wallet',
      network: 'Ethereum Mainnet',
      isPrimary: true
    }
  ]
  walletStore.set(user.id, seeded)
  persistWallets()
  return seeded
}

function syncWalletCount(): void {
  const user = currentState.user
  if (!user) return
  const count = walletStore.get(user.id)?.length ?? 0
  updateCurrentUser({ ...user, walletCount: count })
}

/**
 * Get the authenticated user's wallets.
 *
 * @returns Wallet list for the current user
 */
export function getWallets(): Wallet[] {
  return ensureWallets()
}

/**
 * Add a wallet to the authenticated user.
 *
 * @param input - Address, label, and network
 * @returns Created wallet
 */
export function addWallet(input: Omit<Wallet, 'id' | 'isPrimary'>): Wallet {
  const wallets = ensureWallets()
  walletIdSequence += 1
  const wallet: Wallet = {
    id: `wallet-${Date.now()}-${walletIdSequence}`,
    ...input,
    isPrimary: wallets.length === 0
  }
  wallets.push(wallet)
  persistWallets()
  syncWalletCount()
  return wallet
}

/**
 * Update a wallet owned by the authenticated user.
 *
 * @param walletId - Wallet identifier
 * @param updates - Label, network, or primary flag
 * @returns Updated wallet or null when not owned
 */
export function updateWallet(
  walletId: string,
  updates: Partial<Pick<Wallet, 'label' | 'network' | 'isPrimary'>>
): Wallet | null {
  const wallets = ensureWallets()
  const wallet = wallets.find((entry) => entry.id === walletId)
  if (!wallet) return null

  if (updates.label !== undefined) wallet.label = updates.label
  if (updates.network !== undefined) wallet.network = updates.network
  if (updates.isPrimary === true) {
    for (const entry of wallets) entry.isPrimary = entry.id === walletId
  }
  persistWallets()
  return wallet
}

function persistSession(): void {
  if (typeof localStorage === 'undefined') return
  if (!currentState.user || !currentState.session.isAuthenticated) {
    localStorage.removeItem(SESSION_STORAGE_KEY)
    return
  }
  localStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({ user: currentState.user, session: currentState.session })
  )
}

function hydratePersistedSession(): void {
  if (typeof localStorage === 'undefined') return
  const raw = localStorage.getItem(SESSION_STORAGE_KEY)
  if (!raw) return
  try {
    const parsed = JSON.parse(raw) as { user: UserSummary; session: MockState['session'] }
    if (
      !parsed.user ||
      !parsed.session.expiresAt ||
      Date.parse(parsed.session.expiresAt) <= Date.now()
    ) {
      localStorage.removeItem(SESSION_STORAGE_KEY)
      return
    }
    currentState.user = parsed.user
    currentState.session = { ...parsed.session, isAuthenticated: true }
  } catch {
    localStorage.removeItem(SESSION_STORAGE_KEY)
  }
}

export const initialState: MockState = {
  user: null,
  cart: [],
  favorites: [],
  nfts: nftAvailable,
  nftsSoldOut: nftSoldOut,
  nftsEmpty: false,
  order: null,
  session: {
    isAuthenticated: false,
    accessToken: null,
    refreshToken: null,
    expiresAt: null
  },
  pagination: {
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    search: undefined,
    collectionId: undefined,
    minPrice: undefined,
    maxPrice: undefined
  },
  meta: {
    lastRequest: null,
    requestCount: 0,
    error: null
  }
}

/** Current mutable state - starts as a deep clone of initialState */
let currentState: MockState = structuredClone(initialState)
hydratePersistedSession()
activeCartKey = getActiveCartKey()
hydratePersistedCarts()
currentState.cart = cartStore.get(activeCartKey) ?? []
hydratePersistedFavorites()
activeFavoritesKey = getActiveFavoritesKey()
currentState.favorites = activeFavoritesKey ? favoriteStore.get(activeFavoritesKey) ?? [] : []
hydratePersistedWallets()

/**
 * Get current mock state.
 *
 * @returns Current MockState instance
 * @example
 * const state = getMockState()
 * state.cart.push(item)
 */
export function getMockState(): MockState {
  return currentState
}

/**
 * Update mock state (used by MSW handlers).
 *
 * @param partial - Partial state to merge
 * @returns Updated MockState
 * @example
 * setMockState({ cart: [...cart, newItem] })
 */
export function setMockState(partial: Partial<MockState>): MockState {
  currentState = { ...currentState, ...partial }
  return currentState
}

/**
 * Reset mock state to initial fixtures.
 *
 * Restores all state to initial values defined in initialState.
 * Useful for test isolation between scenarios.
 *
 * @returns Previous state before reset
 * @example
 * beforeEach(() => {
 *   resetMockState()
 * })
 */
export function resetMockState(): MockState {
  const previous = currentState
  currentState = structuredClone(initialState)
  resetAccounts()
  idempotencyKeys.clear()
  orderStore.clear()
  quoteStore.clear()
  cartStore.clear()
  cartStore.set(ANONYMOUS_CART_KEY, [])
  activeCartKey = ANONYMOUS_CART_KEY
  clearPersistedCarts()
  favoriteStore.clear()
  activeFavoritesKey = null
  clearPersistedFavorites()
  walletStore.clear()
  walletIdSequence = 0
  clearPersistedWallets()
  persistSession()
  return previous
}

/**
 * Reset mock state to a specific scenario.
 *
 * @param partial - Partial state to reset to
 * @returns Updated MockState
 * @example
 * resetToScenario({ user: userAlice, cart: cartWithItems })
 */
export function resetToScenario(partial: Partial<MockState>): MockState {
  currentState = { ...structuredClone(initialState), ...partial }
  resetAccounts()
  idempotencyKeys.clear()
  orderStore.clear()
  if (currentState.order) {
    orderStore.set(currentState.order.id, currentState.order)
  }
  quoteStore.clear()
  cartStore.clear()
  activeCartKey = getActiveCartKey()
  cartStore.set(activeCartKey, currentState.cart)
  clearPersistedCarts()
  persistCarts()
  favoriteStore.clear()
  activeFavoritesKey = getActiveFavoritesKey()
  if (activeFavoritesKey) favoriteStore.set(activeFavoritesKey, currentState.favorites)
  clearPersistedFavorites()
  persistFavorites()
  walletStore.clear()
  walletIdSequence = 0
  clearPersistedWallets()
  persistSession()
  return currentState
}

/**
 * Set user state (authentication).
 *
 * @param user - User summary or null for logout
 * @param token - Access token or null
 */
export function setUser(
  user: UserSummary | null,
  token?: string | null,
  expiresAt?: string | null,
  refreshToken?: string | null
): void {
  currentState.user = user
  currentState.session = {
    isAuthenticated: user !== null,
    accessToken: user ? token ?? null : null,
    refreshToken: user ? refreshToken ?? null : null,
    expiresAt: user ? expiresAt ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null
  }
  switchCartForUser()
  switchFavoritesForUser()
  persistSession()
}

/**
 * Update the authenticated user's profile without rotating the session.
 *
 * @param user - Updated user summary
 */
export function updateCurrentUser(user: UserSummary): void {
  currentState.user = user
  for (const account of mockAccounts.values()) {
    if (account.user.id === user.id) {
      account.user = user
    }
  }
  persistSession()
}

/**
 * Update the stored password for an account.
 *
 * @param userId - Account user identifier
 * @param newPassword - New plain-text mock password
 * @returns True when the account was found
 */
export function updatePassword(userId: string, newPassword: string): boolean {
  for (const account of mockAccounts.values()) {
    if (account.user.id === userId) {
      account.password = hashPassword(newPassword)
      return true
    }
  }
  return false
}

/**
 * Add item to cart.
 *
 * @param nftId - NFT identifier
 * @param price - NFT price as string
 * @param quantity - Quantity (default: 1)
 */
export function addToCart(nftId: string, price: string, quantity: number = 1): void {
  const nft =
    currentState.nfts.find((item) => item.id === nftId) ??
    nftAvailable.find((item) => item.id === nftId)

  if (!nft) {
    return
  }

  const existing = currentState.cart.find((item) => item.nftId === nftId)

  if (existing) {
    existing.quantity = Math.min(existing.quantity + quantity, MAX_QUANTITY_PER_NFT)
    existing.total = multiplyMoney(existing.price, existing.quantity)
  } else {
    const safeQuantity = Math.min(Math.max(1, quantity), MAX_QUANTITY_PER_NFT)
    currentState.cart.push({
      nftId,
      price,
      quantity: safeQuantity,
      total: multiplyMoney(price, safeQuantity),
      nft
    })
  }
  saveActiveCart()
}

/**
 * Remove item from cart.
 *
 * @param nftId - NFT identifier to remove
 */
export function removeFromCart(nftId: string): void {
  currentState.cart = currentState.cart.filter(item => item.nftId !== nftId)
  saveActiveCart()
}

/**
 * Update cart item quantity.
 *
 * @param nftId - NFT identifier
 * @param quantity - New quantity
 */
export function updateCartQuantity(nftId: string, quantity: number): void {
  const item = currentState.cart.find(item => item.nftId === nftId)
  if (item) {
    item.quantity = Math.min(Math.max(1, quantity), MAX_QUANTITY_PER_NFT)
    item.total = multiplyMoney(item.price, item.quantity)
    saveActiveCart()
  }
}

/**
 * Set favorites for a user.
 *
 * @param nftIds - Array of NFT favorite IDs
 */
export function setFavorites(nftIds: string[]): void {
  currentState.favorites = nftIds
  persistActiveFavorites()
}

/**
 * Get the current user's favorite NFT IDs.
 *
 * @returns Favorite NFT IDs
 */
export function getFavorites(): string[] {
  return currentState.favorites
}

/**
 * Add an NFT to the current user's favorites (idempotent).
 *
 * @param nftId - NFT identifier to add
 * @returns Updated favorites state
 */
export function addFavorite(nftId: string): string[] {
  if (!currentState.favorites.includes(nftId)) {
    currentState.favorites.push(nftId)
  }
  persistActiveFavorites()
  return currentState.favorites
}

/**
 * Remove an NFT from the current user's favorites (idempotent).
 *
 * @param nftId - NFT identifier to remove
 * @returns Updated favorites state
 */
export function removeFavorite(nftId: string): string[] {
  currentState.favorites = currentState.favorites.filter((id) => id !== nftId)
  persistActiveFavorites()
  return currentState.favorites
}

/**
 * Toggle favorite for a single NFT.
 *
 * @param nftId - NFT identifier to toggle
 * @returns New favorites state
 */
export function toggleFavorite(nftId: string): string[] {
  return isFavorite(nftId) ? removeFavorite(nftId) : addFavorite(nftId)
}

/**
 * Set current order.
 *
 * @param order - Order summary or null
 */
export function setOrder(order: OrderSummary | null): void {
  currentState.order = order
  if (order) {
    orderStore.set(order.id, order)
  }
}

/**
 * Apply an NFT update event to the mock catalog.
 *
 * @param event - Versioned NFT update
 * @returns True when the event was newer than the stored version
 */
export function applyNftUpdate(event: NftUpdatedEvent): boolean {
  const nft = [...currentState.nfts, ...currentState.nftsSoldOut].find(
    (entry) => entry.id === event.nftId
  )
  if (!nft) return false
  if (event.version <= (nft.version ?? 0)) return false

  nft.version = event.version
  nft.price = event.priceEth
  nft.isAvailable = event.availability > 0
  nft.updatedAt = event.updatedAt
  refreshCartPrices()
  return true
}

/**
 * Apply an order update event to the stored order.
 *
 * @param event - Versioned order update
 * @returns Updated order or null when stale or missing
 */
export function applyOrderUpdate(event: OrderUpdatedEvent): OrderSummary | null {
  const order = orderStore.get(event.orderId)
  if (!order) return null
  if (event.version <= (order.version ?? 0)) return order

  return transitionOrder(event.orderId, event.status, {
    transactionId: event.transactionId,
    explorerUrl: event.explorerUrl,
    version: event.version
  })
}

/**
 * Get an order by identifier.
 *
 * @param orderId - Order identifier
 * @returns Order snapshot or null
 */
export function getOrder(orderId: string): OrderSummary | null {
  return orderStore.get(orderId) ?? null
}

/**
 * Apply an order status transition.
 *
 * Terminal states are frozen except the legal edge confirmed -> completed,
 * and versions only move forward. Shared by mock event simulation and REST
 * reads so both observe one state.
 *
 * @param orderId - Order identifier
 * @param status - Next status
 * @param details - Optional transaction data and timestamp
 * @returns Updated order or null when the order does not exist
 */
export function transitionOrder(
  orderId: string,
  status: OrderSummary['status'],
  details: { transactionId?: string; explorerUrl?: string; version?: number; updatedAt?: string } = {}
): OrderSummary | null {
  const order = orderStore.get(orderId)
  if (!order) return null

  // Terminal states are frozen. The only legal move out of a terminal state
  // is the documented lifecycle edge confirmed -> completed. A rejected order
  // can never become completed (money was not paid), and completed is final.
  const isTerminal =
    order.status === 'confirmed' || order.status === 'rejected' || order.status === 'completed'
  const allowedFromTerminal = order.status === 'confirmed' && status === 'completed'
  if (isTerminal && !allowedFromTerminal) return order

  const next: OrderSummary = {
    ...structuredClone(order),
    status,
    version: details.version ?? (order.version ?? 0) + 1,
    transactionId: details.transactionId ?? order.transactionId,
    explorerUrl: details.explorerUrl ?? order.explorerUrl
  }
  orderStore.set(orderId, next)
  if (currentState.order?.id === orderId) {
    currentState.order = next
  }
  return next
}

/**
 * Set pagination state.
 *
 * @param params - Partial pagination parameters
 */
export function setPagination(params: Partial<PaginationParams>): void {
  currentState.pagination = { ...currentState.pagination, ...params }
}

/**
 * Set error state.
 *
 * @param error - Error message or null
 */
export function setError(error: string | null): void {
  currentState.meta.error = error
}

/**
 * Increment request counter.
 *
 * @param error - Optional error message if request failed
 */
export function trackRequest(error?: string): void {
  currentState.meta.requestCount += 1
  currentState.meta.lastRequest = new Date().toISOString()
  if (error) {
    currentState.meta.error = error
  }
}

/**
 * Get the active cart with catalog prices refreshed.
 *
 * @returns Current cart items
 */
export function getCart(): CartItem[] {
  refreshCartPrices()
  return currentState.cart
}

/**
 * Get cart total.
 *
 * @returns Total price as string
 */
export function getCartTotal(): string {
  const micro = currentState.cart.reduce((sum, item) => sum + toMicro(item.total), 0)
  return fromMicro(micro)
}

/**
 * Get cart item count.
 *
 * @returns Total quantity count
 */
export function getCartItemCount(): number {
  return currentState.cart.reduce((sum, item) => sum + item.quantity, 0)
}

/**
 * Check if NFT is in favorites.
 *
 * @param nftId - NFT identifier
 * @returns boolean
 */
export function isFavorite(nftId: string): boolean {
  return currentState.favorites.includes(nftId)
}

/**
 * Check if user is authenticated.
 *
 * @returns boolean
 */
export function isAuthenticated(): boolean {
  const { session, user } = currentState
  if (!session.isAuthenticated || !user) return false
  if (session.expiresAt && Date.parse(session.expiresAt) <= Date.now()) {
    setUser(null)
    return false
  }
  return true
}

/**
 * Get current user.
 *
 * @returns UserSummary or null
 */
export function getCurrentUser(): UserSummary | null {
  return currentState.user
}

/**
 * Validate NFT availability.
 *
 * @param nftId - NFT identifier
 * @returns boolean indicating if NFT is available
 */
export function isNftAvailable(nftId: string): boolean {
  return (
    currentState.nfts.some(nft => nft.id === nftId) &&
    !currentState.nftsSoldOut.some(nft => nft.id === nftId)
  )
}

/**
 * Export utilities for MSW handlers.
 *
 * Handlers import from this file to access and modify mock state.
 */
export const mockStateUtils = {
  getMockState,
  setMockState,
  resetMockState,
  resetToScenario,
  setUser,
  updateCurrentUser,
  updatePassword,
  getWallets,
  addWallet,
  updateWallet,
  findAccountByEmail,
  findAccountByLogin,
  addAccount,
  hashPassword,
  getCart,
  addToCart,
  removeFromCart,
  updateCartQuantity,
  getFavorites,
  setFavorites,
  addFavorite,
  removeFavorite,
  toggleFavorite,
  setOrder,
  getOrder,
  transitionOrder,
  applyNftUpdate,
  applyOrderUpdate,
  setPagination,
  setError,
  trackRequest,
  getCartTotal,
  getCartItemCount,
  isFavorite,
  isAuthenticated,
  getCurrentUser,
  isNftAvailable
}

/** Default export for convenience */
export default {
  getMockState,
  setMockState,
  resetMockState,
  resetToScenario,
  setUser,
  updateCurrentUser,
  updatePassword,
  getWallets,
  addWallet,
  updateWallet,
  findAccountByEmail,
  addAccount,
  hashPassword,
  getCart,
  addToCart,
  removeFromCart,
  updateCartQuantity,
  getFavorites,
  setFavorites,
  addFavorite,
  removeFavorite,
  toggleFavorite,
  setOrder,
  getOrder,
  transitionOrder,
  applyNftUpdate,
  applyOrderUpdate,
  setPagination,
  setError,
  trackRequest,
  getCartTotal,
  getCartItemCount,
  isFavorite,
  isAuthenticated,
  getCurrentUser,
  isNftAvailable,
  mockStateUtils
}
