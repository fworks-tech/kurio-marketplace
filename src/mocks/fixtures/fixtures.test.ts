import { describe, expect, it } from 'vitest'
import {
  favoritesForAlice,
  nftAvailable,
  nftSoldOut,
  orderPending,
  orderRejected,
  orderSuccess,
  sessionAlice,
  userAlice,
  userBob,
  walletPrimary
} from './index'

describe('mock fixtures', () => {
  it('has deterministic unique identifiers', () => {
    const ids = [...nftAvailable, ...nftSoldOut].map((nft) => nft.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(userAlice.id).not.toBe(userBob.id)
  })

  it('covers catalog scenarios with decimal ETH strings', () => {
    expect(nftAvailable.some((nft) => nft.isFeatured)).toBe(true)
    expect(nftSoldOut.some((nft) => !nft.isAvailable)).toBe(true)
    expect(new Set(nftAvailable.map((nft) => nft.collectionId)).size).toBeGreaterThan(1)

    for (const nft of [...nftAvailable, ...nftSoldOut]) {
      expect(nft.price).toMatch(/^\d+(\.\d+)?$/)
      expect(Number.isInteger(nft.version)).toBe(true)
      expect(Number.isNaN(Date.parse(nft.updatedAt))).toBe(false)
    }
  })

  it('covers order states and isolated user data', () => {
    expect([orderPending, orderSuccess, orderRejected].map((order) => order.status)).toEqual([
      'pending',
      'confirmed',
      'rejected'
    ])
    expect(orderSuccess.buyer.id).toBe(userAlice.id)
    expect(orderRejected.buyer.id).toBe(userBob.id)
    expect(favoritesForAlice.length).toBeGreaterThan(0)
    expect(walletPrimary.isPrimary).toBe(true)
    expect(Number.isNaN(Date.parse(sessionAlice.expiresAt))).toBe(false)
  })
})
