import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { nftAvailable, orderPending } from '../mocks/fixtures/index'
import { getCart, getMockState, getOrder, getWallets } from '../mocks/state/mock-state'
import {
  emitNftUpdate,
  freezeTime,
  login,
  loginExpired,
  logout,
  nextTestId,
  resetTestIds,
  resetTestState,
  seedCart,
  seedOrder,
  seedWallet,
  unfreezeTime
, must } from './helpers'

describe('test helpers', () => {
  beforeEach(() => resetTestState())
  afterEach(() => unfreezeTime())

  it('seeds and clears authenticated state', () => {
    login()
    expect(getMockState().session.isAuthenticated).toBe(true)

    logout()
    expect(getMockState().session.isAuthenticated).toBe(false)
  })

  it('supports an expired-session setup', () => {
    loginExpired()
    expect(getMockState().session.expiresAt).toBe('2000-01-01T00:00:00.000Z')
  })

  it('seeds cart, order, and wallet', () => {
    seedCart([{ nft: must(nftAvailable[0]), quantity: 2 }])
    expect(must(getCart()[0]).quantity).toBe(2)

    seedOrder(orderPending)
    expect(getOrder(orderPending.id)?.status).toBe('pending')

    login()
    seedWallet()
    // login seeds a primary wallet on first access, seedWallet adds one more
    expect(getWallets()).toHaveLength(2)
  })

  it('emits versioned NFT updates into state', () => {
    expect(emitNftUpdate(must(nftAvailable[0]), { priceEth: '9.9' })).toBe(true)
    expect(must(getMockState().nfts[0]).price).toBe('9.9')
  })

  it('produces deterministic ids and frozen time', () => {
    resetTestIds()
    expect(nextTestId()).toBe('test-1')
    expect(nextTestId()).toBe('test-2')

    freezeTime('2026-06-01T00:00:00.000Z')
    expect(Date.now()).toBe(new Date('2026-06-01T00:00:00.000Z').getTime())
  })
})
