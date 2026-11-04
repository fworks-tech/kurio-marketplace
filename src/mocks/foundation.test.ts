import { beforeEach, describe, expect, it } from 'vitest'
import { handlers } from './handlers/index'
import { orderPending } from './fixtures/index'
import {
  addToCart,
  getCartTotal,
  getOrder,
  resetMockState,
  setOrder,
  transitionOrder
} from './state/mock-state'

describe('mock backend foundation', () => {
  beforeEach(() => {
    resetMockState()
  })

  it('exports MSW request handlers', () => {
    expect(Array.isArray(handlers)).toBe(true)
    expect(handlers.length).toBeGreaterThan(0)
  })

  it('computes cart totals with integer-cent precision', () => {
    addToCart('nft-003', '0.1', 1)
    addToCart('nft-001', '0.2', 1)

    expect(getCartTotal()).toBe('0.3')
  })

  it('stores orders and guards terminal transitions', () => {
    setOrder(orderPending)
    expect(getOrder(orderPending.id)?.status).toBe('pending')

    const confirmed = transitionOrder(orderPending.id, 'confirmed', {
      transactionId: 'tx-1'
    })
    expect(confirmed?.status).toBe('confirmed')
    expect(confirmed?.version).toBe(2)
    expect(confirmed?.transactionId).toBe('tx-1')

    const regression = transitionOrder(orderPending.id, 'pending')
    expect(regression?.status).toBe('confirmed')
    expect(regression?.version).toBe(2)
  })
})
