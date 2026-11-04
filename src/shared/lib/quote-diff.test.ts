import { describe, expect, it } from 'vitest'
import type { CartQuote } from '@/shared/api/api-types'
import { describeQuoteChanges, diffQuote, hasQuoteChanges } from './quote-diff'

function quote(overrides: Partial<CartQuote> = {}): CartQuote {
  return {
    id: 'q1',
    items: [{ nftId: '1', version: 1, quantity: 1, unitPrice: '2.5', total: '2.5' }],
    subtotal: '2.5',
    discount: '0',
    discountType: null,
    discountValue: 0,
    couponCode: null,
    network: 'ethereum',
    networkFee: '0.01',
    total: '2.51',
    createdAt: '2026-01-01T00:00:00.000Z',
    expiresAt: '2026-01-01T00:15:00.000Z',
    ...overrides
  }
}

describe('diffQuote', () => {
  it('detects a subtotal change as a price change', () => {
    expect(diffQuote(quote(), quote({ subtotal: '3.0' })).price).toBe(true)
  })

  it('detects a removed line as an availability change', () => {
    const changes = diffQuote(quote(), quote({ items: [] }))
    expect(changes.availability).toBe(true)
  })

  it('treats a fee change independently of price', () => {
    const changes = diffQuote(quote(), quote({ networkFee: '0.05' }))
    expect(changes.fee).toBe(true)
    expect(changes.price).toBe(false)
  })
})

describe('describeQuoteChanges', () => {
  it('lists only the changed channels', () => {
    const changes = diffQuote(quote(), quote({ couponCode: 'OFF' }))
    expect(hasQuoteChanges(changes)).toBe(true)
    expect(describeQuoteChanges(changes)).toEqual(['O cupom aplicado mudou.'])
  })

  it('returns nothing when identical', () => {
    expect(hasQuoteChanges(diffQuote(quote(), quote()))).toBe(false)
    expect(describeQuoteChanges(diffQuote(quote(), quote()))).toEqual([])
  })
})
