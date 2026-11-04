import { describe, expect, it } from 'vitest'
import { nftAvailable, orderPending } from '../../mocks/fixtures/index'
import { must } from '../../test/helpers'
import type { CartQuote, NftSummary, OrderSummary } from '../api/api-types'
import {
  applyNftEvent,
  applyNftEventToCatalog,
  applyOrderEvent,
  isQuoteStale
} from './reducers'

const baseNft: NftSummary = { ...must(nftAvailable[0]), version: 5 }
const baseOrder: OrderSummary = { ...structuredClone(orderPending), version: 2 }

const quote: CartQuote = {
  id: 'quote-1',
  items: [{ nftId: 'nft-001', version: 5, quantity: 1, unitPrice: '2.5', total: '2.5' }],
  subtotal: '2.5',
  discount: '0',
  discountType: null,
  discountValue: 0,
  couponCode: null,
  network: 'ethereum',
  networkFee: '0.005',
  total: '2.5',
  createdAt: '2026-01-01T00:00:00.000Z',
  expiresAt: '2026-01-01T00:15:00.000Z'
}

describe('realtime reducers', () => {
  it('applies a newer NFT version', () => {
    const updated = applyNftEvent(baseNft, {
      nftId: 'nft-001',
      version: 6,
      priceEth: '3.5',
      availability: 0,
      updatedAt: '2026-01-02T00:00:00.000Z'
    })
    expect(updated.price).toBe('3.5')
    expect(updated.isAvailable).toBe(false)
    expect(updated.version).toBe(6)
  })

  it('ignores duplicate and outdated NFT versions', () => {
    const stale = { nftId: 'nft-001', version: 5, priceEth: '9', availability: 2, updatedAt: 'x' }
    expect(applyNftEvent(baseNft, stale)).toBe(baseNft)
    expect(applyNftEventToCatalog([baseNft], stale)).toEqual([baseNft])
  })

  it('advances order status while blocking terminal regressions', () => {
    const confirmed = applyOrderEvent(baseOrder, {
      orderId: baseOrder.id,
      version: 3,
      status: 'confirmed',
      transactionId: 'tx-1',
      updatedAt: '2026-01-03T00:00:00.000Z'
    })
    expect(confirmed.status).toBe('confirmed')
    expect(confirmed.transactionId).toBe('tx-1')

    const regressed = applyOrderEvent(confirmed, {
      orderId: baseOrder.id,
      version: 4,
      status: 'pending',
      updatedAt: '2026-01-04T00:00:00.000Z'
    })
    expect(regressed).toBe(confirmed)
  })

  it('flags a quote stale only when a referenced NFT changed', () => {
    expect(isQuoteStale(quote, { nftId: 'nft-001', version: 6, priceEth: '4', availability: 1, updatedAt: 'x' })).toBe(true)
    expect(isQuoteStale(quote, { nftId: 'nft-001', version: 5, priceEth: '2.5', availability: 1, updatedAt: 'x' })).toBe(false)
    expect(isQuoteStale(quote, { nftId: 'other', version: 6, priceEth: '4', availability: 1, updatedAt: 'x' })).toBe(false)
  })
})
