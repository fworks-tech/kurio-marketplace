/**
 * MSW request handlers for the NFT Marketplace API.
 *
 * Centralized collection of all MSW request handlers organized by feature area.
 * Handlers define mock responses for API endpoints including:
 * - NFT catalog operations
 * - Authentication flows
 * - Favorites management
 * - Cart management
 * - Quotes and coupons
 * - Order processing
 * - Profile and wallet operations
 * - Error scenario handlers
 *
 * @module mocks/handlers
 * @see src/shared/api/api-types - Type definitions handlers reference
 * @see src/mocks/state/mock-state.ts - Shared mock state
 * @see src/mocks/fixtures/index.ts - Fixture data sources
 */

import { rest } from '../msw-compat'
import { emitNftUpdated, emitOrderUpdated, socketHandler } from '../socket'
import type {
  NftSummary,
  NftDetail,
  NftFacets,
  UserSummary,
  CartItem,
  CartQuote,
  Favorite,
  Wallet,
  OrderSummary,
  OrderItem,
  QuoteNetwork,
  ApiResponse,
  ApiErrorResponse,
  AuthSession,
  NftUpdatedEvent,
  OrderUpdatedEvent
} from '../../shared/api/api-types'
import { ErrorCode } from '../../shared/api/api-error'
import { toMicro, fromMicro } from '../../shared/api/money'
import {
  mockStateUtils,
  idempotencyKeys,
  quoteStore,
  mockAccounts,
  MAX_QUANTITY_PER_NFT
} from '../state/mock-state'
import { COLLECTION_LABELS, NETWORK_ORDER, nftAvailable, nftSoldOut } from '../fixtures/index'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9_-]{8,128}$/
const SUPPORTED_NETWORKS = ['Ethereum Mainnet', 'Polygon', 'Arbitrum', 'Optimism']
let orderSequence = 0

const QUOTE_TTL_MS = 15 * 60 * 1000

const COUPONS: Record<
  string,
  { type: 'percentage' | 'fixed'; value: number; expired?: boolean }
> = {
  WELCOME10: { type: 'percentage', value: 10 },
  FLAT5: { type: 'fixed', value: 0.5 },
  EXPIRED20: { type: 'percentage', value: 20, expired: true }
}

const NETWORK_FEES: Record<string, string> = {
  ethereum: '0.005',
  polygon: '0.001',
  base: '0.0005'
}

const DEFAULT_NETWORK_FEE = '0.005'

/** Deterministic, order-independent id derived from quote content. */
function stableHash(input: string): string {
  let h = 5381
  for (let i = 0; i < input.length; i += 1) {
    h = ((h * 33) ^ input.charCodeAt(i)) >>> 0
  }
  return h.toString(36)
}

function buildQuote(
  cart: CartItem[],
  coupon: (typeof COUPONS)[string] | null,
  network: string,
  couponCode: string | null
): CartQuote {
  const now = new Date()
  const items = cart.map((item) => ({
    nftId: item.nftId,
    version: item.nft.version ?? 0,
    quantity: item.quantity,
    unitPrice: item.price,
    total: fromMicro(toMicro(item.price) * item.quantity)
  }))
  const subtotalMicro = items.reduce((sum, item) => sum + toMicro(item.total), 0)
  const rawDiscountMicro = coupon
    ? coupon.type === 'percentage'
      ? Math.round((subtotalMicro * coupon.value) / 100)
      : toMicro(String(coupon.value))
    : 0
  const discountMicro = Math.min(rawDiscountMicro, subtotalMicro)
  const networkFeeMicro = toMicro(NETWORK_FEES[network] ?? DEFAULT_NETWORK_FEE)
  const totalMicro = Math.max(0, subtotalMicro - discountMicro + networkFeeMicro)

  const fingerprint = items
    .map((item) => `${item.nftId}:${item.quantity}:${item.unitPrice}`)
    .join('|')
  const id = `quote-${stableHash(`${fingerprint}|${couponCode ?? ''}|${network}`)}`

  return {
    id,
    items,
    subtotal: fromMicro(subtotalMicro),
    discount: fromMicro(discountMicro),
    discountType: coupon?.type ?? null,
    discountValue: coupon?.value ?? 0,
    couponCode,
    network,
    networkFee: fromMicro(networkFeeMicro),
    total: fromMicro(totalMicro),
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + QUOTE_TTL_MS).toISOString()
  }
}

function quoteError(
  status: number,
  code: ErrorCode,
  message: string,
  type: ApiErrorResponse['error']['type']
): ApiErrorResponse {
  return {
    success: false,
    error: { code, message, type },
    timestamp: new Date().toISOString(),
    requestId: 'req-' + Date.now()
  }
}

function createSession(user: UserSummary): AuthSession {
  const suffix = `${user.id}-${Date.now()}`
  return {
    user,
    accessToken: `token-${suffix}`,
    refreshToken: `refresh-${suffix}`,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  }
}

function normalizePositiveInt(value: string | null, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function normalizePageSize(value: string | null, fallback: number): number {
  return Math.min(normalizePositiveInt(value, fallback), 100)
}

/** Order facet values by a canonical vocabulary, unknown values last (alphabetical). */
function orderFacetValues(values: string[], order: readonly string[]): string[] {
  return [...values].sort((a, b) => {
    const ia = order.indexOf(a)
    const ib = order.indexOf(b)
    const rankA = ia === -1 ? order.length : ia
    const rankB = ib === -1 ? order.length : ib
    return rankA - rankB || a.localeCompare(b)
  })
}

function compareNfts(sort: string): (a: NftSummary, b: NftSummary) => number {
  switch (sort) {
    case 'price_asc':
      return (a, b) => Number.parseFloat(a.price) - Number.parseFloat(b.price) || a.id.localeCompare(b.id)
    case 'price_desc':
      return (a, b) => Number.parseFloat(b.price) - Number.parseFloat(a.price) || a.id.localeCompare(b.id)
    case 'name_asc':
      return (a, b) => a.title.localeCompare(b.title) || a.id.localeCompare(b.id)
    case 'name_desc':
      return (a, b) => b.title.localeCompare(a.title) || a.id.localeCompare(b.id)
    case 'featured':
      return (a, b) =>
        Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured)) ||
        b.createdAt.localeCompare(a.createdAt) ||
        a.id.localeCompare(b.id)
    case 'newest':
    default:
      return (a, b) => b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id)
  }
}

/** All MSW request handlers exported for use in server/browser */
export const handlers = [
  /** ==================== NFT CATALOG HANDLERS ==================== */

  /** GET /api/nfts - List NFTs with pagination, search, filters */
  rest.get('*/api/nfts', (req, res, ctx) => {
    const params = req.url.searchParams
    const search = params.get('search')
    const collection = params.get('collection')
    const minPrice = params.get('minPrice')
    const maxPrice = params.get('maxPrice')
    const availability = params.get('availability')
    const featured = params.get('featured')
    const network = params.get('network')
    const sort = params.get('sort') ?? 'newest'

    const pageNum = normalizePositiveInt(params.get('page'), 1)
    const pageSize = normalizePageSize(params.get('pageSize'), 20)
    const offset = (pageNum - 1) * pageSize

    const state = mockStateUtils.getMockState()
    let results = state.nftsEmpty ? [] : ([...state.nfts, ...state.nftsSoldOut] as NftSummary[])

    if (search) {
      const needle = search.toLowerCase()
      results = results.filter(
        (nft) =>
          nft.title.toLowerCase().includes(needle) ||
          nft.description.toLowerCase().includes(needle)
      )
    }

    if (collection) {
      results = results.filter((nft) => nft.collectionId === collection)
    }

    if (minPrice) {
      const min = Number.parseFloat(minPrice)
      if (!Number.isNaN(min)) {
        results = results.filter((nft) => Number.parseFloat(nft.price) >= min)
      }
    }

    if (maxPrice) {
      const max = Number.parseFloat(maxPrice)
      if (!Number.isNaN(max)) {
        results = results.filter((nft) => Number.parseFloat(nft.price) <= max)
      }
    }

    if (availability !== null) {
      const wantAvailable = availability === 'true'
      results = results.filter((nft) => nft.isAvailable === wantAvailable)
    }

    if (featured !== null) {
      const wantFeatured = featured === 'true'
      results = results.filter((nft) => Boolean(nft.isFeatured) === wantFeatured)
    }

    if (network) {
      results = results.filter((nft) => nft.network === network)
    }

    results.sort(compareNfts(sort))

    const total = results.length
    const paginated = results.slice(offset, offset + pageSize)

    return res(
      ctx.json<ApiResponse<NftSummary[]>>({
        data: paginated,
        meta: {
          page: pageNum,
          limit: pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        },
        success: true,
        requestId: 'req-' + Date.now(),
        timestamp: new Date().toISOString()
      })
    )
  }),

  /** GET /api/nfts/facets - Collections, networks and price bounds across the whole catalog */
  rest.get('*/api/nfts/facets', (_req, res, ctx) => {
    const state = mockStateUtils.getMockState()
    const catalog: NftSummary[] = state.nftsEmpty ? [] : [...state.nfts, ...state.nftsSoldOut]

    const collectionCounts = new Map<string, number>()
    const networkCounts = new Map<string, number>()
    let minPrice = ''
    let maxPrice = ''

    for (const nft of catalog) {
      if (nft.collectionId) {
        collectionCounts.set(nft.collectionId, (collectionCounts.get(nft.collectionId) ?? 0) + 1)
      }
      if (nft.network) {
        networkCounts.set(nft.network, (networkCounts.get(nft.network) ?? 0) + 1)
      }
      const price = Number.parseFloat(nft.price)
      if (Number.isFinite(price) && price > 0) {
        if (minPrice === '' || price < Number.parseFloat(minPrice)) minPrice = nft.price
        if (maxPrice === '' || price > Number.parseFloat(maxPrice)) maxPrice = nft.price
      }
    }

    const facetOptions = (
      counts: Map<string, number>,
      order: readonly string[],
      labels?: Record<string, string>
    ) =>
      orderFacetValues([...counts.keys()], order).map((value) => ({
        value,
        label: labels?.[value] ?? value,
        count: counts.get(value) ?? 0
      }))

    const data: NftFacets = {
      collections: facetOptions(
        collectionCounts,
        Object.keys(COLLECTION_LABELS),
        COLLECTION_LABELS
      ),
      networks: facetOptions(networkCounts, NETWORK_ORDER),
      minPrice: minPrice || '0',
      maxPrice: maxPrice || '0'
    }

    return res(
      ctx.json<ApiResponse<NftFacets>>({
        data,
        meta: { page: 1, limit: 1, total: 1, totalPages: 1 },
        success: true,
        requestId: 'req-' + Date.now(),
        timestamp: new Date().toISOString()
      })
    )
  }),

  /** GET /api/nfts/:nftId - Get NFT detail */
  rest.get('*/api/nfts/:nftId', (req, res, ctx) => {
    const nftId = String(req.params.nftId)

    const catalog = [
      ...mockStateUtils.getMockState().nfts,
      ...mockStateUtils.getMockState().nftsSoldOut
    ]
    const nft = catalog.find((n) => n.id === nftId)

    if (!nft) {
      return res(
        ctx.status(404),
        ctx.json<ApiErrorResponse>({
          success: false,
          error: {
            code: ErrorCode.ResourceNotFound,
            message: 'NFT not found',
            type: 'not_found'
          },
          timestamp: new Date().toISOString(),
          requestId: 'req-' + Date.now()
        })
      )
    }

    return res(
      ctx.json<ApiResponse<NftDetail>>({
        data: { ...nft, stats: nft.stats ?? { viewCount: 0, bidCount: 0, floorPrice: '0' } },
        meta: { page: 1, limit: 1, total: 1, totalPages: 1 },
        success: true,
        requestId: 'req-' + Date.now(),
        timestamp: new Date().toISOString()
      })
    )
  }),

  /** ==================== AUTHENTICATION HANDLERS ==================== */

  /** POST /api/auth/register */
  rest.post('*/api/auth/register', async (req, res, ctx) => {
    const body = await req.json<{
      username?: string
      email?: string
      password?: string
      walletAddress?: string
    }>()

    const fieldErrors: Record<string, string[]> = {}
    if (!body.username || body.username.trim().length < 3) {
      fieldErrors.username = ['Username must be at least 3 characters.']
    }
    if (!body.email || !EMAIL_PATTERN.test(body.email)) {
      fieldErrors.email = ['Enter a valid email address.']
    }
    if (!body.password || body.password.length < 8) {
      fieldErrors.password = ['Password must be at least 8 characters.']
    }

    if (Object.keys(fieldErrors).length > 0) {
      return res(
        ctx.status(400),
        ctx.json<ApiErrorResponse>({
          success: false,
          error: {
            code: ErrorCode.ValidationFailed,
            message: 'Please check the form for errors.',
            fieldErrors,
            type: 'validation'
          },
          timestamp: new Date().toISOString(),
          requestId: 'req-' + Date.now()
        })
      )
    }

    const email = body.email!.trim().toLowerCase()
    if (mockStateUtils.findAccountByEmail(email)) {
      return res(
        ctx.status(409),
        ctx.json<ApiErrorResponse>({
          success: false,
          error: {
            code: ErrorCode.DuplicateEmail,
            message: 'This email is already registered.',
            type: 'conflict'
          },
          timestamp: new Date().toISOString(),
          requestId: 'req-' + Date.now()
        })
      )
    }

    const localPart = email.split('@')[0]
    const newUser: UserSummary = {
      id: `user-${localPart}`,
      address: body.walletAddress || `0x${localPart}`,
      username: body.username!.trim(),
      avatar: null,
      walletCount: 0,
      totalVolume: '0',
      isVerified: false
    }

    mockStateUtils.addAccount({ user: newUser, email, password: mockStateUtils.hashPassword(body.password!) })
    const session = createSession(newUser)
    mockStateUtils.setUser(newUser, session.accessToken, session.expiresAt, session.refreshToken)

    return res(
      ctx.json<ApiResponse<AuthSession>>({
        data: session,
        meta: { page: 1, limit: 1, total: 1, totalPages: 1 },
        success: true,
        requestId: 'req-' + Date.now(),
        timestamp: new Date().toISOString()
      })
    )
  }),

  /** POST /api/auth/login */
  rest.post('*/api/auth/login', async (req, res, ctx) => {
    const body = await req.json<{ email?: string; password?: string }>()

    const fieldErrors: Record<string, string[]> = {}
    if (!body.email) {
      fieldErrors.email = ['Email is required.']
    }
    if (!body.password) {
      fieldErrors.password = ['Password is required.']
    }

    if (Object.keys(fieldErrors).length > 0) {
      return res(
        ctx.status(400),
        ctx.json<ApiErrorResponse>({
          success: false,
          error: {
            code: ErrorCode.ValidationFailed,
            message: 'Please check the form for errors.',
            fieldErrors,
            type: 'validation'
          },
          timestamp: new Date().toISOString(),
          requestId: 'req-' + Date.now()
        })
      )
    }

    const account = mockStateUtils.findAccountByLogin(body.email!)
    if (!account || account.password !== mockStateUtils.hashPassword(body.password!)) {
      return res(
        ctx.status(401),
        ctx.json<ApiErrorResponse>({
          success: false,
          error: {
            code: ErrorCode.InvalidCredentials,
            message: 'Invalid email or password.',
            type: 'unauthorized'
          },
          timestamp: new Date().toISOString(),
          requestId: 'req-' + Date.now()
        })
      )
    }

    const session = createSession(account.user)
    mockStateUtils.setUser(
      account.user,
      session.accessToken,
      session.expiresAt,
      session.refreshToken
    )

    return res(
      ctx.json<ApiResponse<AuthSession>>({
        data: session,
        meta: { page: 1, limit: 1, total: 1, totalPages: 1 },
        success: true,
        requestId: 'req-' + Date.now(),
        timestamp: new Date().toISOString()
      })
    )
  }),

  /** GET /api/auth/session */
  rest.get('*/api/auth/session', (_req, res, ctx) => {
    if (!mockStateUtils.isAuthenticated()) {
      return res(
        ctx.status(401),
        ctx.json<ApiErrorResponse>({
          success: false,
          error: {
            code: ErrorCode.SessionExpired,
            message: 'Your session has expired. Please log in again.',
            type: 'unauthorized'
          },
          timestamp: new Date().toISOString(),
          requestId: 'req-' + Date.now()
        })
      )
    }

    const user = mockStateUtils.getCurrentUser()!
    const { accessToken, refreshToken, expiresAt } = mockStateUtils.getMockState().session
    const session: AuthSession = {
      user,
      accessToken: accessToken ?? 'token-test',
      refreshToken: refreshToken ?? 'refresh-test',
      expiresAt: expiresAt ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }

    return res(
      ctx.json<ApiResponse<AuthSession>>({
        data: session,
        meta: { page: 1, limit: 1, total: 1, totalPages: 1 },
        success: true,
        requestId: 'req-' + Date.now(),
        timestamp: new Date().toISOString()
      })
    )
  }),

  /** POST /api/auth/logout */
  rest.post('*/api/auth/logout', (_req, res, ctx) => {
    mockStateUtils.setUser(null)

    return res(
      ctx.json({
        success: true,
        data: null,
        meta: { page: 1, limit: 1, total: 1, totalPages: 1 },
        requestId: 'req-' + Date.now(),
        timestamp: new Date().toISOString()
      })
    )
  }),

  /** ==================== FAVORITES HANDLERS ==================== */

  /** GET /api/favorites */
  rest.get('*/api/favorites', (_req, res, ctx) => {
    const isAuth = mockStateUtils.isAuthenticated()

    if (!isAuth) {
      return res(
        ctx.status(401),
        ctx.json<ApiErrorResponse>({
          success: false,
          error: {
            code: ErrorCode.NotAuthenticated,
            message: 'You are not authorized to perform this action.',
            type: 'unauthorized'
          },
          timestamp: new Date().toISOString(),
          requestId: 'req-' + Date.now()
        })
      )
    }

    const favorites: Favorite[] = mockStateUtils.getFavorites().map((id) => ({
      id,
      isFavorite: true
    }))

    return res(
      ctx.json<ApiResponse<{ favorites: Favorite[] }>>({
        data: { favorites },
        meta: { page: 1, limit: 100, total: favorites.length, totalPages: 1 },
        success: true,
        requestId: 'req-' + Date.now(),
        timestamp: new Date().toISOString()
      })
    )
  }),

  /** POST /api/favorites/:nftId */
  rest.post('*/api/favorites/:nftId', (req, res, ctx) => {
    const nftId = String(req.params.nftId)
    const isAuth = mockStateUtils.isAuthenticated()

    if (!isAuth) {
      return res(
        ctx.status(401),
        ctx.json<ApiErrorResponse>({
          success: false,
          error: {
            code: ErrorCode.NotAuthenticated,
            message: 'Authentication required.',
            type: 'unauthorized'
          },
          timestamp: new Date().toISOString(),
          requestId: 'req-' + Date.now()
        })
      )
    }

    if (req.headers.get('x-mock-fail')) {
      return res(
        ctx.status(500),
        ctx.json<ApiErrorResponse>({
          success: false,
          error: {
            code: ErrorCode.InternalError,
            message: 'Failed to add favorite.',
            type: 'server_error'
          },
          timestamp: new Date().toISOString(),
          requestId: 'req-' + Date.now()
        })
      )
    }

    const exists =
      mockStateUtils.getMockState().nfts.some((nft) => nft.id === nftId) ||
      mockStateUtils.getMockState().nftsSoldOut.some((nft) => nft.id === nftId)

    if (!exists) {
      return res(
        ctx.status(404),
        ctx.json<ApiErrorResponse>({
          success: false,
          error: {
            code: ErrorCode.ResourceNotFound,
            message: 'NFT not found.',
            type: 'not_found'
          },
          timestamp: new Date().toISOString(),
          requestId: 'req-' + Date.now()
        })
      )
    }

    const currentFavorites = mockStateUtils.addFavorite(nftId)

    return res(
      ctx.json<ApiResponse<{ favorites: string[] }>>({
        data: { favorites: currentFavorites },
        meta: { page: 1, limit: 100, total: currentFavorites.length, totalPages: 1 },
        success: true,
        requestId: 'req-' + Date.now(),
        timestamp: new Date().toISOString()
      })
    )
  }),

  /** DELETE /api/favorites/:nftId */
  rest.delete('*/api/favorites/:nftId', (req, res, ctx) => {
    const nftId = String(req.params.nftId)
    const isAuth = mockStateUtils.isAuthenticated()

    if (!isAuth) {
      return res(
        ctx.status(401),
        ctx.json<ApiErrorResponse>({
          success: false,
          error: {
            code: ErrorCode.NotAuthenticated,
            message: 'Authentication required.',
            type: 'unauthorized'
          },
          timestamp: new Date().toISOString(),
          requestId: 'req-' + Date.now()
        })
      )
    }

    if (req.headers.get('x-mock-fail')) {
      return res(
        ctx.status(500),
        ctx.json<ApiErrorResponse>({
          success: false,
          error: {
            code: ErrorCode.InternalError,
            message: 'Failed to remove favorite.',
            type: 'server_error'
          },
          timestamp: new Date().toISOString(),
          requestId: 'req-' + Date.now()
        })
      )
    }

    if (!mockStateUtils.getFavorites().includes(nftId)) {
      return res(
        ctx.status(404),
        ctx.json<ApiErrorResponse>({
          success: false,
          error: {
            code: ErrorCode.ResourceNotFound,
            message: 'Favorite not found.',
            type: 'not_found'
          },
          timestamp: new Date().toISOString(),
          requestId: 'req-' + Date.now()
        })
      )
    }

    const currentFavorites = mockStateUtils.removeFavorite(nftId)

    return res(
      ctx.json<ApiResponse<{ favorites: string[] }>>({
        data: { favorites: currentFavorites },
        meta: { page: 1, limit: 100, total: currentFavorites.length, totalPages: 1 },
        success: true,
        requestId: 'req-' + Date.now(),
        timestamp: new Date().toISOString()
      })
    )
  }),

  /** ==================== CART HANDLERS ==================== */

  /** GET /api/cart */
  rest.get('*/api/cart', (_req, res, ctx) => {
    const cart = mockStateUtils.getCart()

    return res(
      ctx.json<ApiResponse<CartItem[]>>({
        data: cart,
        meta: { page: 1, limit: 100, total: cart.length, totalPages: 1 },
        success: true,
        requestId: 'req-' + Date.now(),
        timestamp: new Date().toISOString()
      })
    )
  }),

  /** POST /api/cart/items */
  rest.post('*/api/cart/items', async (req, res, ctx) => {
    const body = await req.json<{ nftId?: string; quantity?: number }>()
    const nftId = body.nftId

    if (!nftId) {
      return res(
        ctx.status(400),
        ctx.json<ApiErrorResponse>({
          success: false,
          error: {
            code: ErrorCode.ValidationFailed,
            message: 'NFT id is required.',
            type: 'validation'
          },
          timestamp: new Date().toISOString(),
          requestId: 'req-' + Date.now()
        })
      )
    }

    const nft =
      nftAvailable.find((item) => item.id === nftId) ??
      nftSoldOut.find((item) => item.id === nftId)

    if (!nft) {
      return res(
        ctx.status(404),
        ctx.json<ApiErrorResponse>({
          success: false,
          error: {
            code: ErrorCode.ResourceNotFound,
            message: 'NFT not found.',
            type: 'not_found'
          },
          timestamp: new Date().toISOString(),
          requestId: 'req-' + Date.now()
        })
      )
    }

    if (!mockStateUtils.isNftAvailable(nftId)) {
      return res(
        ctx.status(400),
        ctx.json<ApiErrorResponse>({
          success: false,
          error: {
            code: ErrorCode.ItemNotAvailable,
            message: 'This NFT is no longer available.',
            type: 'validation'
          },
          timestamp: new Date().toISOString(),
          requestId: 'req-' + Date.now()
        })
      )
    }

    const quantity = body.quantity ?? 1
    if (!Number.isInteger(quantity) || quantity < 1) {
      return res(
        ctx.status(400),
        ctx.json<ApiErrorResponse>({
          success: false,
          error: {
            code: ErrorCode.ValidationFailed,
            message: 'Quantity must be a positive integer.',
            type: 'validation'
          },
          timestamp: new Date().toISOString(),
          requestId: 'req-' + Date.now()
        })
      )
    }

    const currentCart = mockStateUtils.getCart()
    const existing = currentCart.find((item) => item.nftId === nftId)

    if ((existing?.quantity ?? 0) + quantity > MAX_QUANTITY_PER_NFT) {
      return res(
        ctx.status(400),
        ctx.json<ApiErrorResponse>({
          success: false,
          error: {
            code: ErrorCode.ValidationFailed,
            message: `Maximum quantity per NFT is ${MAX_QUANTITY_PER_NFT}.`,
            type: 'validation'
          },
          timestamp: new Date().toISOString(),
          requestId: 'req-' + Date.now()
        })
      )
    }

    mockStateUtils.addToCart(nftId, nft.price, quantity)

    const updatedCart = mockStateUtils.getCart()

    return res(
      ctx.json<ApiResponse<CartItem[]>>({
        data: updatedCart,
        meta: { page: 1, limit: 100, total: updatedCart.length, totalPages: 1 },
        success: true,
        requestId: 'req-' + Date.now(),
        timestamp: new Date().toISOString()
      })
    )
  }),

  /** PATCH /api/cart/items/:nftId */
  rest.patch('*/api/cart/items/:nftId', async (req, res, ctx) => {
    const nftId = String(req.params.nftId)
    const body = await req.json<{ quantity?: number }>()
    const quantity = body.quantity

    if (quantity === undefined || !Number.isInteger(quantity) || quantity < 1) {
      return res(
        ctx.status(400),
        ctx.json<ApiErrorResponse>({
          success: false,
          error: {
            code: ErrorCode.ValidationFailed,
            message: 'Quantity must be a positive integer.',
            type: 'validation'
          },
          timestamp: new Date().toISOString(),
          requestId: 'req-' + Date.now()
        })
      )
    }

    if (quantity > MAX_QUANTITY_PER_NFT) {
      return res(
        ctx.status(400),
        ctx.json<ApiErrorResponse>({
          success: false,
          error: {
            code: ErrorCode.ValidationFailed,
            message: `Maximum quantity per NFT is ${MAX_QUANTITY_PER_NFT}.`,
            type: 'validation'
          },
          timestamp: new Date().toISOString(),
          requestId: 'req-' + Date.now()
        })
      )
    }

    const currentCart = mockStateUtils.getCart()

    if (!currentCart.some((item) => item.nftId === nftId)) {
      return res(
        ctx.status(404),
        ctx.json<ApiErrorResponse>({
          success: false,
          error: {
            code: ErrorCode.ResourceNotFound,
            message: 'Cart item not found.',
            type: 'not_found'
          },
          timestamp: new Date().toISOString(),
          requestId: 'req-' + Date.now()
        })
      )
    }

    if (!mockStateUtils.isNftAvailable(nftId)) {
      return res(
        ctx.status(400),
        ctx.json<ApiErrorResponse>({
          success: false,
          error: {
            code: ErrorCode.ItemNotAvailable,
            message: 'This NFT is no longer available.',
            type: 'validation'
          },
          timestamp: new Date().toISOString(),
          requestId: 'req-' + Date.now()
        })
      )
    }

    mockStateUtils.updateCartQuantity(nftId, quantity)

    const updatedCart = mockStateUtils.getCart()

    return res(
      ctx.json<ApiResponse<CartItem[]>>({
        data: updatedCart,
        meta: { page: 1, limit: 100, total: updatedCart.length, totalPages: 1 },
        success: true,
        requestId: 'req-' + Date.now(),
        timestamp: new Date().toISOString()
      })
    )
  }),

  /** DELETE /api/cart/items/:nftId */
  rest.delete('*/api/cart/items/:nftId', (req, res, ctx) => {
    const nftId = String(req.params.nftId)
    const currentCart = mockStateUtils.getCart()

    if (!currentCart.some((item) => item.nftId === nftId)) {
      return res(
        ctx.status(404),
        ctx.json<ApiErrorResponse>({
          success: false,
          error: {
            code: ErrorCode.ResourceNotFound,
            message: 'Cart item not found.',
            type: 'not_found'
          },
          timestamp: new Date().toISOString(),
          requestId: 'req-' + Date.now()
        })
      )
    }

    mockStateUtils.removeFromCart(nftId)

    const updatedCart = mockStateUtils.getCart()

    return res(
      ctx.json<ApiResponse<CartItem[]>>({
        data: updatedCart,
        meta: { page: 1, limit: 100, total: updatedCart.length, totalPages: 1 },
        success: true,
        requestId: 'req-' + Date.now(),
        timestamp: new Date().toISOString()
      })
    )
  }),

  /** POST /api/cart/quote */
  rest.post('*/api/cart/quote', async (req, res, ctx) => {
    const body = await req.json<{ code?: string; network?: string; quoteId?: string }>()
    const cart = mockStateUtils.getCart()

    if (body.quoteId) {
      const existing = quoteStore.get(body.quoteId)
      if (!existing) {
        return res(
          ctx.status(404),
          ctx.json<ApiErrorResponse>(
            quoteError(404, ErrorCode.ResourceNotFound, 'Quote not found.', 'not_found')
          )
        )
      }

      if (new Date(existing.expiresAt).getTime() <= new Date().getTime()) {
        return res(
          ctx.status(410),
          ctx.json<ApiErrorResponse>(
            quoteError(410, ErrorCode.QuoteExpired, 'This quote has expired. Request a new one.', 'validation')
          )
        )
      }

      if (existing.couponCode) {
        const coupon = COUPONS[existing.couponCode]
        if (!coupon || coupon.expired) {
          return res(
            ctx.status(410),
            ctx.json<ApiErrorResponse>(
              quoteError(410, ErrorCode.CouponExpired, 'This coupon has expired.', 'validation')
            )
          )
        }
      }

      const current = new Map(cart.map((item) => [item.nftId, item]))
      for (const item of existing.items) {
        const live = current.get(item.nftId)
        if (!live) {
          return res(
            ctx.status(409),
            ctx.json<ApiErrorResponse>(
              quoteError(
                409,
                ErrorCode.ItemNotAvailable,
                'Quote items are no longer in the cart.',
                'conflict'
              )
            )
          )
        }
        if (!mockStateUtils.isNftAvailable(item.nftId)) {
          return res(
            ctx.status(409),
            ctx.json<ApiErrorResponse>(
              quoteError(
                409,
                ErrorCode.ItemNotAvailable,
                'An item in this quote is no longer available.',
                'conflict'
              )
            )
          )
        }
        if ((live.nft.version ?? 0) !== item.version || live.price !== item.unitPrice) {
          return res(
            ctx.status(409),
            ctx.json<ApiErrorResponse>(
              quoteError(
                409,
                ErrorCode.PriceChanged,
                'Item price or version changed. Request a new quote.',
                'conflict'
              )
            )
          )
        }
      }

      return res(
        ctx.json<ApiResponse<CartQuote>>({
          data: existing,
          meta: { page: 1, limit: 1, total: 1, totalPages: 1 },
          success: true,
          requestId: 'req-' + Date.now(),
          timestamp: new Date().toISOString()
        })
      )
    }

    if (cart.length === 0) {
      return res(
        ctx.status(400),
        ctx.json<ApiErrorResponse>(
          quoteError(400, ErrorCode.ValidationFailed, 'Cart is empty.', 'validation')
        )
      )
    }

    if (
      cart.some(
        (item) =>
          !Number.isInteger(item.quantity) ||
          item.quantity < 1 ||
          item.quantity > MAX_QUANTITY_PER_NFT
      )
    ) {
      return res(
        ctx.status(400),
        ctx.json<ApiErrorResponse>(
          quoteError(
            400,
            ErrorCode.ValidationFailed,
            `Cart quantities must be integers between 1 and ${MAX_QUANTITY_PER_NFT}.`,
            'validation'
          )
        )
      )
    }

    if (cart.some((item) => !mockStateUtils.isNftAvailable(item.nftId))) {
      return res(
        ctx.status(400),
        ctx.json<ApiErrorResponse>(
          quoteError(
            400,
            ErrorCode.ItemNotAvailable,
            'An item in your cart is no longer available.',
            'validation'
          )
        )
      )
    }

    let coupon: (typeof COUPONS)[string] | null = null
    if (body.code) {
      const found = COUPONS[body.code]
      if (!found) {
        return res(
          ctx.status(400),
          ctx.json<ApiErrorResponse>(
            quoteError(400, ErrorCode.CouponInvalid, 'The coupon code is invalid.', 'validation')
          )
        )
      }
      if (found.expired) {
        return res(
          ctx.status(410),
          ctx.json<ApiErrorResponse>(
            quoteError(410, ErrorCode.CouponExpired, 'This coupon has expired.', 'validation')
          )
        )
      }
      coupon = found
    }

    const network = body.network ?? 'ethereum'
    if (!NETWORK_FEES[network]) {
      return res(
        ctx.status(400),
        ctx.json<ApiErrorResponse>(
          quoteError(400, ErrorCode.ValidationFailed, `Unsupported network: ${network}.`, 'validation')
        )
      )
    }

    const quote = buildQuote(cart, coupon, network, body.code ?? null)
    quoteStore.set(quote.id, quote)

    return res(
      ctx.json<ApiResponse<CartQuote>>({
        data: quote,
        meta: { page: 1, limit: 1, total: 1, totalPages: 1 },
        success: true,
        requestId: 'req-' + Date.now(),
        timestamp: new Date().toISOString()
      })
    )
  }),

  /** ==================== ORDER HANDLERS ==================== */

  /** POST /api/orders */
  rest.post('*/api/orders', async (req, res, ctx) => {
    const idempotencyKey = req.headers.get('idempotency-key')
    const isAuth = mockStateUtils.isAuthenticated()

    if (!isAuth) {
      return res(
        ctx.status(401),
        ctx.json<ApiErrorResponse>({
          success: false,
          error: {
            code: ErrorCode.NotAuthenticated,
            message: 'Authentication required to place an order.',
            type: 'unauthorized'
          },
          timestamp: new Date().toISOString(),
          requestId: 'req-' + Date.now()
        })
      )
    }

    if (!idempotencyKey) {
      return res(
        ctx.status(400),
        ctx.json<ApiErrorResponse>({
          success: false,
          error: {
            code: ErrorCode.ValidationFailed,
            message: 'Idempotency-Key header is required.',
            type: 'validation'
          },
          timestamp: new Date().toISOString(),
          requestId: 'req-' + Date.now()
        })
      )
    }

    // Parse request body (the client-controlled part of the order intent)
    const body = await req
      .json<{ network?: string; code?: string }>()
      .catch(() => ({}) as { network?: string; code?: string })
    const network = (body.network ?? 'ethereum') as QuoteNetwork
    const couponCode = body.code ?? null

    if (!IDEMPOTENCY_KEY_PATTERN.test(idempotencyKey)) {
      return res(
        ctx.status(400),
        ctx.json<ApiErrorResponse>({
          success: false,
          error: {
            code: ErrorCode.ValidationFailed,
            message: 'Idempotency-Key must be 8-128 characters (A-Z, a-z, 0-9, _ , -).',
            type: 'validation'
          },
          timestamp: new Date().toISOString(),
          requestId: 'req-' + Date.now()
        })
      )
    }

    const cart = mockStateUtils.getCart()
    const cartHash = JSON.stringify(cart.map((item) => [item.nftId, item.quantity, item.price]))
    const existing = idempotencyKeys.get(idempotencyKey)

    if (existing) {
      // Same key replays the original order only when the request intent
      // (network + coupon) matches AND the cart is either unchanged or already
      // consumed. Any other reuse is a genuine key conflict.
      const sameIntent = existing.network === network && existing.couponCode === couponCode
      const sameCart = cart.length === 0 || existing.cartHash === cartHash
      if (sameIntent && sameCart) {
        return res(
          ctx.json<ApiResponse<OrderSummary>>({
            data: existing.order,
            meta: { page: 1, limit: 1, total: 1, totalPages: 1 },
            success: true,
            requestId: 'req-' + Date.now(),
            timestamp: new Date().toISOString()
          })
        )
      }
      return res(
        ctx.status(409),
        ctx.json<ApiErrorResponse>({
          success: false,
          error: {
            code: ErrorCode.IdempotencyKeyConflict,
            message: 'A request with this key already exists with different content.',
            type: 'conflict'
          },
          timestamp: new Date().toISOString(),
          requestId: 'req-' + Date.now()
        })
      )
    }

    if (cart.length === 0) {
      return res(
        ctx.status(400),
        ctx.json<ApiErrorResponse>({
          success: false,
          error: {
            code: ErrorCode.ValidationFailed,
            message: 'Cart is empty.',
            type: 'validation'
          },
          timestamp: new Date().toISOString(),
          requestId: 'req-' + Date.now()
        })
      )
    }

    if (
      cart.some(
        (item) =>
          !Number.isInteger(item.quantity) ||
          item.quantity < 1 ||
          item.quantity > MAX_QUANTITY_PER_NFT
      )
    ) {
      return res(
        ctx.status(400),
        ctx.json<ApiErrorResponse>({
          success: false,
          error: {
            code: ErrorCode.ValidationFailed,
            message: `Cart quantities must be integers between 1 and ${MAX_QUANTITY_PER_NFT}.`,
            type: 'validation'
          },
          timestamp: new Date().toISOString(),
          requestId: 'req-' + Date.now()
        })
      )
    }

    if (cart.some((item) => !mockStateUtils.isNftAvailable(item.nftId))) {
      return res(
        ctx.status(400),
        ctx.json<ApiErrorResponse>({
          success: false,
          error: {
            code: ErrorCode.ItemNotAvailable,
            message: 'An item in your cart is no longer available.',
            type: 'validation'
          },
          timestamp: new Date().toISOString(),
          requestId: 'req-' + Date.now()
        })
      )
    }

    if (!NETWORK_FEES[network]) {
      return res(
        ctx.status(400),
        ctx.json<ApiErrorResponse>({
          success: false,
          error: {
            code: ErrorCode.ValidationFailed,
            message: `Unsupported network: ${network}.`,
            type: 'validation'
          },
          timestamp: new Date().toISOString(),
          requestId: 'req-' + Date.now()
        })
      )
    }

    let coupon: (typeof COUPONS)[string] | null = null
    if (couponCode) {
      const found = COUPONS[couponCode]
      if (!found) {
        return res(
          ctx.status(400),
          ctx.json<ApiErrorResponse>({
            success: false,
            error: {
              code: ErrorCode.CouponInvalid,
              message: 'The coupon code is invalid.',
              type: 'validation'
            },
            timestamp: new Date().toISOString(),
            requestId: 'req-' + Date.now()
          })
        )
      }
      if (found.expired) {
        return res(
          ctx.status(410),
          ctx.json<ApiErrorResponse>({
            success: false,
            error: {
              code: ErrorCode.CouponExpired,
              message: 'This coupon has expired.',
              type: 'validation'
            },
            timestamp: new Date().toISOString(),
            requestId: 'req-' + Date.now()
          })
        )
      }
      coupon = found
    }

    const quote = buildQuote(cart, coupon, network, couponCode)
    const items: OrderItem[] = quote.items.map((item) => {
      const line = cart.find((entry) => entry.nftId === item.nftId)
      if (!line) {
        throw new Error(`Quote item ${item.nftId} has no cart line`)
      }
      return {
        nftId: item.nftId,
        nft: structuredClone(line.nft),
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total
      }
    })
    const primaryItem = items[0]
    if (!primaryItem) {
      throw new Error('Cannot create an order from an empty quote')
    }

    orderSequence += 1
    const order: OrderSummary = {
      id: `order-${Date.now()}-${orderSequence}`,
      status: 'pending',
      version: 1,
      price: quote.subtotal,
      fee: quote.networkFee,
      total: quote.total,
      items,
      subtotal: quote.subtotal,
      discount: quote.discount,
      couponCode: quote.couponCode,
      network,
      createdAt: new Date().toISOString(),
      nft: primaryItem.nft,
      buyer: mockStateUtils.getCurrentUser()!
    }

    // Store idempotency record for future replay/conflict detection
    idempotencyKeys.set(idempotencyKey, {
      network,
      couponCode,
      cartHash,
      order
    })
    mockStateUtils.setOrder(order)

    // Clear only the cart items that were purchased
    for (const item of items) {
      mockStateUtils.removeFromCart(item.nftId)
    }

    if (req.headers.get('x-mock-timeout')) {
      return res(
        ctx.status(504),
        ctx.json<ApiErrorResponse>({
          success: false,
          error: {
            code: ErrorCode.OrderTimeout,
            message: 'The order timed out. Please try again.',
            type: 'server_error'
          },
          timestamp: new Date().toISOString(),
          requestId: 'req-' + Date.now()
        })
      )
    }

    return res(
      ctx.json<ApiResponse<OrderSummary>>({
        data: order,
        meta: { page: 1, limit: 1, total: 1, totalPages: 1 },
        success: true,
        requestId: 'req-' + Date.now(),
        timestamp: new Date().toISOString()
      })
    )
  }),

  /** GET /api/orders/:orderId */
  rest.get('*/api/orders/:orderId', (req, res, ctx) => {
    const orderId = String(req.params.orderId)

    if (!mockStateUtils.isAuthenticated()) {
      return res(
        ctx.status(401),
        ctx.json<ApiErrorResponse>({
          success: false,
          error: {
            code: ErrorCode.NotAuthenticated,
            message: 'Authentication required.',
            type: 'unauthorized'
          },
          timestamp: new Date().toISOString(),
          requestId: 'req-' + Date.now()
        })
      )
    }

    const order = mockStateUtils.getOrder(orderId)
    const currentUser = mockStateUtils.getCurrentUser()!

    if (!order || order.buyer.id !== currentUser.id) {
      // Do not leak that the order exists under another user.
      return res(
        ctx.status(404),
        ctx.json<ApiErrorResponse>({
          success: false,
          error: {
            code: ErrorCode.ResourceNotFound,
            message: 'Order not found.',
            type: 'not_found'
          },
          timestamp: new Date().toISOString(),
          requestId: 'req-' + Date.now()
        })
      )
    }

    return res(
      ctx.json<ApiResponse<OrderSummary>>({
        data: order,
        meta: { page: 1, limit: 1, total: 1, totalPages: 1 },
        success: true,
        requestId: 'req-' + Date.now(),
        timestamp: new Date().toISOString()
      })
    )
  }),

  /** GET /api/orders/:orderId/receipt */
  rest.get('*/api/orders/:orderId/receipt', (req, res, ctx) => {
    const orderId = String(req.params.orderId)
    const isAuth = mockStateUtils.isAuthenticated()

    if (!isAuth) {
      return res(
        ctx.status(401),
        ctx.json<ApiErrorResponse>({
          success: false,
          error: {
            code: ErrorCode.NotAuthenticated,
            message: 'Authentication required.',
            type: 'unauthorized'
          },
          timestamp: new Date().toISOString(),
          requestId: 'req-' + Date.now()
        })
      )
    }

    const order = mockStateUtils.getOrder(orderId)
    const currentUser = mockStateUtils.getCurrentUser()!

    if (!order || order.buyer.id !== currentUser.id) {
      // Do not leak that the order exists under another user.
      return res(
        ctx.status(404),
        ctx.json<ApiErrorResponse>({
          success: false,
          error: {
            code: ErrorCode.ResourceNotFound,
            message: 'Order not found.',
            type: 'not_found'
          },
          timestamp: new Date().toISOString(),
          requestId: 'req-' + Date.now()
        })
      )
    }

    // Return immutable purchase-time snapshot
    const receipt: OrderSummary = structuredClone(order)

    return res(
      ctx.json<ApiResponse<OrderSummary>>({
        data: receipt,
        meta: { page: 1, limit: 1, total: 1, totalPages: 1 },
        success: true,
        requestId: 'req-' + Date.now(),
        timestamp: new Date().toISOString()
      })
    )
  }),

  /** ==================== PROFILE HANDLERS ==================== */

  /** GET /api/profile */
  rest.get('*/api/profile', (_req, res, ctx) => {
    const isAuth = mockStateUtils.isAuthenticated()

    if (!isAuth) {
      return res(
        ctx.status(401),
        ctx.json<ApiErrorResponse>({
          success: false,
          error: {
            code: ErrorCode.NotAuthenticated,
            message: 'Authentication required.',
            type: 'unauthorized'
          },
          timestamp: new Date().toISOString(),
          requestId: 'req-' + Date.now()
        })
      )
    }

    const user = mockStateUtils.getCurrentUser()!

    return res(
      ctx.json<ApiResponse<UserSummary>>({
        data: user,
        meta: { page: 1, limit: 1, total: 1, totalPages: 1 },
        success: true,
        requestId: 'req-' + Date.now(),
        timestamp: new Date().toISOString()
      })
    )
  }),

  /** PATCH /api/profile */
  rest.patch('*/api/profile', async (req, res, ctx) => {
    const isAuth = mockStateUtils.isAuthenticated()

    if (!isAuth) {
      return res(
        ctx.status(401),
        ctx.json<ApiErrorResponse>({
          success: false,
          error: {
            code: ErrorCode.NotAuthenticated,
            message: 'Authentication required.',
            type: 'unauthorized'
          },
          timestamp: new Date().toISOString(),
          requestId: 'req-' + Date.now()
        })
      )
    }

    const updates = await req.json<{
      username?: unknown
      displayName?: unknown
      email?: unknown
      ensName?: unknown
      avatar?: unknown
    }>()
    const fieldErrors: Record<string, string[]> = {}

    if ('username' in updates) {
      const username = typeof updates.username === 'string' ? updates.username.trim() : ''
      if (username.length < 3 || username.length > 30) {
        fieldErrors.username = ['Username must be between 3 and 30 characters.']
      }
    }

    if ('displayName' in updates) {
      const displayName = typeof updates.displayName === 'string' ? updates.displayName.trim() : ''
      if (displayName.length < 2 || displayName.length > 60) {
        fieldErrors.displayName = ['Display name must be between 2 and 60 characters.']
      }
    }

    if ('email' in updates) {
      const email = typeof updates.email === 'string' ? updates.email.trim() : ''
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        fieldErrors.email = ['E-mail inválido.']
      }
    }

    if ('ensName' in updates && updates.ensName !== null) {
      const ensName = typeof updates.ensName === 'string' ? updates.ensName.trim() : ''
      if (ensName.length > 0 && !/^[a-z0-9-]{2,}$/i.test(ensName)) {
        fieldErrors.ensName = ['ENS name accepts letters, numbers and hyphens only.']
      }
    }

    if ('avatar' in updates && updates.avatar !== null && typeof updates.avatar !== 'string') {
      fieldErrors.avatar = ['Avatar must be a string or null.']
    }

    if (Object.keys(fieldErrors).length > 0) {
      return res(
        ctx.status(400),
        ctx.json<ApiErrorResponse>({
          success: false,
          error: {
            code: ErrorCode.ValidationFailed,
            message: 'Please check the form for errors.',
            fieldErrors,
            type: 'validation'
          },
          timestamp: new Date().toISOString(),
          requestId: 'req-' + Date.now()
        })
      )
    }

    const current = mockStateUtils.getCurrentUser()!
    const updatedUser: UserSummary = {
      ...current,
      ...('username' in updates && typeof updates.username === 'string'
        ? { username: updates.username.trim() }
        : {}),
      ...('displayName' in updates && typeof updates.displayName === 'string'
        ? { displayName: updates.displayName.trim() }
        : {}),
      ...('email' in updates && typeof updates.email === 'string'
        ? { email: updates.email.trim() }
        : {}),
      ...('ensName' in updates && typeof updates.ensName === 'string'
        ? { ensName: updates.ensName.trim() }
        : {}),
      ...('avatar' in updates ? { avatar: updates.avatar as string | null } : {})
    }
    mockStateUtils.updateCurrentUser(updatedUser)

    return res(
      ctx.json<ApiResponse<UserSummary>>({
        data: updatedUser,
        meta: { page: 1, limit: 1, total: 1, totalPages: 1 },
        success: true,
        requestId: 'req-' + Date.now(),
        timestamp: new Date().toISOString()
      })
    )
  }),

  /** POST /api/profile/avatar */
  rest.post('*/api/profile/avatar', async (req, res, ctx) => {
    if (!mockStateUtils.isAuthenticated()) {
      return res(
        ctx.status(401),
        ctx.json<ApiErrorResponse>({
          success: false,
          error: {
            code: ErrorCode.NotAuthenticated,
            message: 'Authentication required.',
            type: 'unauthorized'
          },
          timestamp: new Date().toISOString(),
          requestId: 'req-' + Date.now()
        })
      )
    }

    const { avatar } = await req.json<{ avatar?: unknown }>()

    if (typeof avatar !== 'string' || avatar.trim().length === 0) {
      return res(
        ctx.status(400),
        ctx.json<ApiErrorResponse>({
          success: false,
          error: {
            code: ErrorCode.ValidationFailed,
            message: 'Please check the form for errors.',
            fieldErrors: { avatar: ['Avatar is required.'] },
            type: 'validation'
          },
          timestamp: new Date().toISOString(),
          requestId: 'req-' + Date.now()
        })
      )
    }

    const updatedUser: UserSummary = {
      ...mockStateUtils.getCurrentUser()!,
      avatar: avatar.trim()
    }
    mockStateUtils.updateCurrentUser(updatedUser)

    return res(
      ctx.json<ApiResponse<UserSummary>>({
        data: updatedUser,
        meta: { page: 1, limit: 1, total: 1, totalPages: 1 },
        success: true,
        requestId: 'req-' + Date.now(),
        timestamp: new Date().toISOString()
      })
    )
  }),

  /** POST /api/profile/password */
  rest.post('*/api/profile/password', async (req, res, ctx) => {
    if (!mockStateUtils.isAuthenticated()) {
      return res(
        ctx.status(401),
        ctx.json<ApiErrorResponse>({
          success: false,
          error: {
            code: ErrorCode.NotAuthenticated,
            message: 'Authentication required.',
            type: 'unauthorized'
          },
          timestamp: new Date().toISOString(),
          requestId: 'req-' + Date.now()
        })
      )
    }

    const user = mockStateUtils.getCurrentUser()!
    const account = [...mockAccounts.values()].find((entry) => entry.user.id === user.id)
    const { currentPassword, newPassword } = await req.json<{
      currentPassword?: unknown
      newPassword?: unknown
    }>()
    const fieldErrors: Record<string, string[]> = {}

    if (typeof currentPassword !== 'string' || currentPassword.length === 0) {
      fieldErrors.currentPassword = ['Current password is required.']
    } else if (!account || account.password !== mockStateUtils.hashPassword(currentPassword)) {
      fieldErrors.currentPassword = ['Current password is incorrect.']
    }

    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      fieldErrors.newPassword = ['New password must be at least 8 characters.']
    }

    if (Object.keys(fieldErrors).length > 0) {
      return res(
        ctx.status(400),
        ctx.json<ApiErrorResponse>({
          success: false,
          error: {
            code: ErrorCode.ValidationFailed,
            message: 'Please check the form for errors.',
            fieldErrors,
            type: 'validation'
          },
          timestamp: new Date().toISOString(),
          requestId: 'req-' + Date.now()
        })
      )
    }

    mockStateUtils.updatePassword(user.id, newPassword as string)

    return res(
      ctx.json<ApiResponse<{ changed: boolean }>>({
        data: { changed: true },
        meta: { page: 1, limit: 1, total: 1, totalPages: 1 },
        success: true,
        requestId: 'req-' + Date.now(),
        timestamp: new Date().toISOString()
      })
    )
  }),

  /** GET /api/wallets */
  rest.get('*/api/wallets', (_req, res, ctx) => {
    if (!mockStateUtils.isAuthenticated()) {
      return res(
        ctx.status(401),
        ctx.json<ApiErrorResponse>({
          success: false,
          error: {
            code: ErrorCode.NotAuthenticated,
            message: 'Authentication required.',
            type: 'unauthorized'
          },
          timestamp: new Date().toISOString(),
          requestId: 'req-' + Date.now()
        })
      )
    }

    const wallets = mockStateUtils.getWallets()

    return res(
      ctx.json<ApiResponse<Wallet[]>>({
        data: wallets,
        meta: { page: 1, limit: 100, total: wallets.length, totalPages: 1 },
        success: true,
        requestId: 'req-' + Date.now(),
        timestamp: new Date().toISOString()
      })
    )
  }),

  /** POST /api/wallets */
  rest.post('*/api/wallets', async (req, res, ctx) => {
    if (!mockStateUtils.isAuthenticated()) {
      return res(
        ctx.status(401),
        ctx.json<ApiErrorResponse>({
          success: false,
          error: {
            code: ErrorCode.NotAuthenticated,
            message: 'Authentication required.',
            type: 'unauthorized'
          },
          timestamp: new Date().toISOString(),
          requestId: 'req-' + Date.now()
        })
      )
    }

    const { address, label, network } = await req.json<{
      address?: unknown
      label?: unknown
      network?: unknown
    }>()
    const fieldErrors: Record<string, string[]> = {}

    if (typeof address !== 'string' || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      fieldErrors.address = ['Address must be a 40-character hex string prefixed with 0x.']
    } else if (
      mockStateUtils
        .getWallets()
        .some((wallet) => wallet.address.toLowerCase() === address.toLowerCase())
    ) {
      return res(
        ctx.status(409),
        ctx.json<ApiErrorResponse>({
          success: false,
          error: {
            code: ErrorCode.Conflict,
            message: 'A wallet with this address already exists.',
            type: 'conflict'
          },
          timestamp: new Date().toISOString(),
          requestId: 'req-' + Date.now()
        })
      )
    }

    if (typeof label !== 'string' || label.trim().length === 0 || label.trim().length > 30) {
      fieldErrors.label = ['Label must be between 1 and 30 characters.']
    }

    if (typeof network !== 'string' || !SUPPORTED_NETWORKS.includes(network)) {
      fieldErrors.network = [`Network must be one of: ${SUPPORTED_NETWORKS.join(', ')}.`]
    }

    if (Object.keys(fieldErrors).length > 0) {
      return res(
        ctx.status(400),
        ctx.json<ApiErrorResponse>({
          success: false,
          error: {
            code: ErrorCode.ValidationFailed,
            message: 'Please check the form for errors.',
            fieldErrors,
            type: 'validation'
          },
          timestamp: new Date().toISOString(),
          requestId: 'req-' + Date.now()
        })
      )
    }

    const wallet = mockStateUtils.addWallet({
      address: address as string,
      label: (label as string).trim(),
      network: network as string
    })

    return res(
      ctx.json<ApiResponse<Wallet>>({
        data: wallet,
        meta: { page: 1, limit: 1, total: 1, totalPages: 1 },
        success: true,
        requestId: 'req-' + Date.now(),
        timestamp: new Date().toISOString()
      })
    )
  }),

  /** PATCH /api/wallets/:walletId */
  rest.patch('*/api/wallets/:walletId', async (req, res, ctx) => {
    if (!mockStateUtils.isAuthenticated()) {
      return res(
        ctx.status(401),
        ctx.json<ApiErrorResponse>({
          success: false,
          error: {
            code: ErrorCode.NotAuthenticated,
            message: 'Authentication required.',
            type: 'unauthorized'
          },
          timestamp: new Date().toISOString(),
          requestId: 'req-' + Date.now()
        })
      )
    }

    const walletId = String(req.params.walletId)
    const { label, network, isPrimary } = await req.json<{
      label?: unknown
      network?: unknown
      isPrimary?: unknown
    }>()
    const fieldErrors: Record<string, string[]> = {}

    if (
      label !== undefined &&
      (typeof label !== 'string' || label.trim().length === 0 || label.trim().length > 30)
    ) {
      fieldErrors.label = ['Label must be between 1 and 30 characters.']
    }

    if (network !== undefined && (typeof network !== 'string' || !SUPPORTED_NETWORKS.includes(network))) {
      fieldErrors.network = [`Network must be one of: ${SUPPORTED_NETWORKS.join(', ')}.`]
    }

    if (Object.keys(fieldErrors).length > 0) {
      return res(
        ctx.status(400),
        ctx.json<ApiErrorResponse>({
          success: false,
          error: {
            code: ErrorCode.ValidationFailed,
            message: 'Please check the form for errors.',
            fieldErrors,
            type: 'validation'
          },
          timestamp: new Date().toISOString(),
          requestId: 'req-' + Date.now()
        })
      )
    }

    const wallet = mockStateUtils.updateWallet(walletId, {
      ...(typeof label === 'string' ? { label: label.trim() } : {}),
      ...(typeof network === 'string' ? { network } : {}),
      ...(isPrimary === true ? { isPrimary: true } : {})
    })

    if (!wallet) {
      return res(
        ctx.status(404),
        ctx.json<ApiErrorResponse>({
          success: false,
          error: {
            code: ErrorCode.ResourceNotFound,
            message: 'Wallet not found.',
            type: 'not_found'
          },
          timestamp: new Date().toISOString(),
          requestId: 'req-' + Date.now()
        })
      )
    }

    return res(
      ctx.json<ApiResponse<Wallet>>({
        data: wallet,
        meta: { page: 1, limit: 1, total: 1, totalPages: 1 },
        success: true,
        requestId: 'req-' + Date.now(),
        timestamp: new Date().toISOString()
      })
    )
  }),

  /** ==================== ERROR SCENARIO HANDLERS ==================== */

  /** Deterministic simulator: change an NFT and broadcast the nft.updated event */
  rest.post('/api/__simulate/nft-updated', async (req, res, ctx) => {
    const body = await req.json<{
      nftId?: string
      priceEth?: string
      availability?: number
      version?: number
    }>()
    const current = mockStateUtils.getMockState().nfts.find((nft) => nft.id === body.nftId)
    if (!current) {
      return res(
        ctx.status(404),
        ctx.json<ApiErrorResponse>({
          success: false,
          error: {
            code: ErrorCode.ResourceNotFound,
            message: 'The requested resource could not be found.',
            type: 'not_found'
          },
          timestamp: new Date().toISOString(),
          requestId: 'req-' + Date.now()
        })
      )
    }
    const event: NftUpdatedEvent = {
      nftId: current.id,
      version: body.version ?? (current.version ?? 0) + 1,
      priceEth: body.priceEth ?? current.price,
      availability: body.availability ?? (current.isAvailable ? 1 : 0),
      updatedAt: new Date().toISOString()
    }
    const applied = emitNftUpdated(event)
    return res(
      ctx.json<ApiResponse<{ applied: boolean; event: NftUpdatedEvent }>>({
        data: { applied, event },
        meta: { page: 1, limit: 1, total: 1, totalPages: 1 },
        success: true,
        requestId: 'req-' + Date.now(),
        timestamp: new Date().toISOString()
      })
    )
  }),

  /** Deterministic simulator: transition a stored order and broadcast order.updated */
  rest.post('/api/__simulate/order-updated', async (req, res, ctx) => {
    const body = await req.json<{
      orderId?: string
      status?: 'pending' | 'confirmed' | 'rejected'
      transactionId?: string
      explorerUrl?: string
    }>()
    const order = body.orderId ? mockStateUtils.getOrder(body.orderId) : null
    if (!order) {
      return res(
        ctx.status(404),
        ctx.json<ApiErrorResponse>({
          success: false,
          error: {
            code: ErrorCode.ResourceNotFound,
            message: 'The requested resource could not be found.',
            type: 'not_found'
          },
          timestamp: new Date().toISOString(),
          requestId: 'req-' + Date.now()
        })
      )
    }
    const status = body.status ?? 'confirmed'
    const event: OrderUpdatedEvent = {
      orderId: order.id,
      version: (order.version ?? 0) + 1,
      status,
      transactionId: body.transactionId,
      explorerUrl: body.explorerUrl,
      updatedAt: new Date().toISOString()
    }
    emitOrderUpdated(event, order.buyer.id)
    const updated = mockStateUtils.getOrder(order.id)
    return res(
      ctx.json<ApiResponse<{ event: OrderUpdatedEvent; order: OrderSummary }>>({
        data: { event, order: updated ?? order },
        meta: { page: 1, limit: 1, total: 1, totalPages: 1 },
        success: true,
        requestId: 'req-' + Date.now(),
        timestamp: new Date().toISOString()
      })
    )
  }),

  /** Validation error handler for unmatched API POST requests */
  rest.post('*/api/*', (_req, res, ctx) => {
    return res(
      ctx.status(422),
      ctx.json<ApiErrorResponse>({
        success: false,
        error: {
          code: ErrorCode.ValidationFailed,
          message: 'Validation failed. Please check the form for errors.',
          type: 'validation'
        },
        timestamp: new Date().toISOString(),
        requestId: 'req-' + Date.now()
      })
    )
  }),

  /** 404 Not Found catch-all for API routes only — static assets must pass through */
  rest.all('*/api/*', (_req, res, ctx) => {
    return res(
      ctx.status(404),
      ctx.json<ApiErrorResponse>({
        success: false,
        error: {
          code: ErrorCode.ResourceNotFound,
          message: 'The requested resource could not be found.',
          type: 'not_found'
        },
        timestamp: new Date().toISOString(),
        requestId: 'req-' + Date.now()
      })
    )
  }),

  socketHandler
]

/** Initialize all handlers with mock state */
export function initializeHandlers(): void {
  // Handlers use mockStateUtils from ../state/mock-state directly.
}
