/**
 * Test setup helpers (Epic 19).
 *
 * Thin, readable wrappers over the mock state and socket emitters so tests can
 * start from a known state, simulate sessions, and emit real-time events
 * without touching handler internals or editing fixtures.
 */

import { vi } from 'vitest'
import { orderPending, sessionAlice, userAlice } from '../mocks/fixtures/index'
import { emitNftUpdated, emitOrderUpdated } from '../mocks/socket'
import { setScenario } from '../mocks/scenarios'
import {
  addFavorite,
  addToCart,
  addWallet,
  quoteStore,
  resetMockState,
  setOrder,
  setUser
} from '../mocks/state/mock-state'
import type {
  CartQuote,
  NftSummary,
  NftUpdatedEvent,
  OrderSummary,
  OrderUpdatedEvent,
  Wallet
} from '../shared/api/api-types'

let testIdCounter = 0

/** Reset the deterministic identifier counter (call alongside state reset) */
export function resetTestIds(): void {
  testIdCounter = 0
}

/** Return a stable, incrementing identifier for deterministic assertions */
export function nextTestId(prefix = 'test'): string {
  testIdCounter += 1
  return `${prefix}-${testIdCounter}`
}

/** Pin `Date.now` to an ISO instant until `unfreezeTime` is called */
export function freezeTime(iso: string): void {
  vi.setSystemTime(new Date(iso))
}

/** Restore the real clock */
export function unfreezeTime(): void {
  vi.useRealTimers()
}

/** Clear all mock state and test identifiers to a known baseline */
export function resetTestState(): void {
  resetMockState()
  resetTestIds()
}

/** Narrow an indexed access to a defined value, failing with a clear message */
export function must<T>(value: T | undefined | null, label = 'indexed value'): T {
  if (value === undefined || value === null) {
    throw new Error(`Expected ${label} to exist`)
  }
  return value
}

/** Sign in as a user and return the token used for the session */
export function login(user = userAlice, token = sessionAlice.accessToken): string {
  setUser(user, token)
  return token
}

/** Sign out back to an anonymous session */
export function logout(): void {
  setUser(null)
}

/** Sign in with an already-expired session token */
export function loginExpired(user = userAlice): void {
  setUser(user, 'expired-token', '2000-01-01T00:00:00.000Z')
}

/** Seed the cart from a list of NFTs with quantities */
export function seedCart(
  entries: Array<{ nft: NftSummary; quantity?: number }>,
  userToken?: string
): void {
  if (userToken) login(userAlice, userToken)
  for (const { nft, quantity = 1 } of entries) {
    addToCart(nft.id, nft.price, quantity)
  }
}

/** Persist an order into the mock order store */
export function seedOrder(order: OrderSummary = orderPending): OrderSummary {
  setOrder(order)
  return order
}

/** Connect a wallet for the current session */
export function seedWallet(
  input: Omit<Wallet, 'id' | 'isPrimary'> = {
    address: '0x1234567890abcdef1234567890abcdef12345678',
    label: 'Main',
    network: 'Ethereum Mainnet'
  }
): Wallet {
  return addWallet(input)
}

/** Add a favorite NFT for the current session */
export function seedFavorite(nftId: string): void {
  addFavorite(nftId)
}

/** Store a quote by id so quote lookups resolve deterministically */
export function seedQuote(quote: CartQuote): CartQuote {
  quoteStore.set(quote.id, quote)
  return quote
}

/** Build a versioned NFT update event from a fixture NFT */
export function nftUpdateEvent(
  nft: NftSummary,
  overrides: Partial<NftUpdatedEvent> = {}
): NftUpdatedEvent {
  return {
    nftId: nft.id,
    version: (nft.version ?? 0) + 1,
    priceEth: nft.price,
    availability: nft.isAvailable ? 1 : 0,
    updatedAt: new Date().toISOString(),
    ...overrides
  }
}

/** Build a versioned order update event from a fixture order */
export function orderUpdateEvent(
  order: OrderSummary,
  overrides: Partial<OrderUpdatedEvent> = {}
): OrderUpdatedEvent {
  return {
    orderId: order.id,
    version: (order.version ?? 0) + 1,
    status: 'pending',
    updatedAt: new Date().toISOString(),
    ...overrides
  }
}

/** Emit an NFT update through the mock socket layer */
export function emitNftUpdate(nft: NftSummary, overrides: Partial<NftUpdatedEvent> = {}): boolean {
  return emitNftUpdated(nftUpdateEvent(nft, overrides))
}

/** Emit an order update through the mock socket layer */
export function emitOrderUpdate(
  order: OrderSummary,
  overrides: Partial<OrderUpdatedEvent> = {},
  userId?: string
): void {
  emitOrderUpdated(orderUpdateEvent(order, overrides), userId)
}

/** Activate a named failure scenario for the current test */
export function useScenario(name: string): void {
  setScenario(name)
}
