import axios from 'axios'
import { beforeEach, describe, expect, it } from 'vitest'
import { resetScenarios, SCENARIO_HEADER, setScenario } from './scenarios'
import { resetMockState } from './state/mock-state'

const api = axios.create({
  baseURL: 'http://localhost',
  validateStatus: () => true
})

function scenario(name: string) {
  return { headers: { [SCENARIO_HEADER]: name } }
}

describe('deterministic failure scenarios', () => {
  beforeEach(() => {
    resetMockState()
    resetScenarios()
  })

  it('maps HTTP failure scenarios to the standard error envelope', async () => {
    const matrix = [
      ['http-400', 400, 'VALIDATION_ERROR'],
      ['http-401', 401, 'UNAUTHORIZED'],
      ['http-403', 403, 'FORBIDDEN'],
      ['http-404', 404, 'NOT_FOUND'],
      ['http-409', 409, 'CONFLICT'],
      ['http-500', 500, 'INTERNAL_ERROR']
    ] as const

    for (const [name, status, code] of matrix) {
      const res = await api.get('/api/nfts', scenario(name))
      expect(res.status).toBe(status)
      expect(res.data.success).toBe(false)
      expect(res.data.error.code).toBe(code)
      expect(res.data.requestId).toMatch(/^req-/)
    }
  })

  it('supports domain-specific scenarios', async () => {
    const cases = [
      ['session-expired', 401, 'SESSION_EXPIRED'],
      ['payment-rejected', 402, 'PAYMENT_REJECTED'],
      ['invalid-coupon', 400, 'INVALID_COUPON'],
      ['expired-coupon', 410, 'EXPIRED_COUPON'],
      ['price-changed', 409, 'PRICE_CHANGED'],
      ['sold-out', 409, 'OUT_OF_STOCK'],
      ['idempotency-conflict', 409, 'IDEMPOTENCY_CONFLICT'],
      ['timeout', 504, 'ORDER_TIMEOUT']
    ] as const

    for (const [name, status, code] of cases) {
      const res = await api.get('/api/nfts', scenario(name))
      expect(res.status).toBe(status)
      expect(res.data.error.code).toBe(code)
    }
  })

  it('simulates network failures', async () => {
    await expect(api.get('/api/nfts', scenario('network-failure'))).rejects.toThrow(
      /network error/i
    )
  })

  it('applies configurable latency and out-of-order responses', async () => {
    const slowStart = Date.now()
    await api.get('/api/nfts', scenario('slow'))
    expect(Date.now() - slowStart).toBeGreaterThanOrEqual(600)

    const firstStart = Date.now()
    await api.get('/api/nfts', scenario('out-of-order'))
    const firstElapsed = Date.now() - firstStart
    const secondStart = Date.now()
    await api.get('/api/nfts', scenario('out-of-order'))
    const secondElapsed = Date.now() - secondStart

    expect(firstElapsed).toBeGreaterThan(secondElapsed)
  })

  it('selects a scenario globally and clears it on reset', async () => {
    setScenario('http-500')
    const failed = await api.get('/api/nfts')
    expect(failed.status).toBe(500)

    resetScenarios()
    const ok = await api.get('/api/nfts')
    expect(ok.status).toBe(200)
  })
})
