import axios from 'axios'
import { beforeEach, describe, expect, it } from 'vitest'
import { nftAvailable } from './fixtures/index'
import { must } from '../test/helpers'
import {
  MAX_QUANTITY_PER_NFT,
  findAccountByEmail,
  hashPassword,
  quoteStore,
  resetMockState
} from './state/mock-state'

const api = axios.create({
  baseURL: 'http://localhost',
  validateStatus: () => true
})

async function login(email = 'alice@example.com', password = 'password123') {
  return api.post('/api/auth/login', { email, password })
}

async function addToCart(nftId: string, quantity = 1) {
  return api.post('/api/cart/items', { nftId, quantity })
}

describe('mock API edge cases', () => {
  beforeEach(() => {
    resetMockState()
  })

  it('rejects a revalidation of an expired quote', async () => {
    await login()
    await addToCart(must(nftAvailable[0]).id)

    const created = await api.post('/api/cart/quote', {})
    expect(created.status).toBe(200)
    const quoteId = created.data.data.id as string

    const stored = quoteStore.get(quoteId)!
    quoteStore.set(quoteId, { ...stored, expiresAt: '2000-01-01T00:00:00.000Z' })

    const revalidated = await api.post('/api/cart/quote', { quoteId })
    expect(revalidated.status).toBe(410)
    expect(revalidated.data.error.code).toBe('QUOTE_EXPIRED')
  })

  it('conflicts when the same idempotency key carries a different request body', async () => {
    await login()
    await addToCart(must(nftAvailable[0]).id)

    const first = await api.post(
      '/api/orders',
      { network: 'ethereum' },
      { headers: { 'Idempotency-Key': 'edge-idem-diffbody' } }
    )
    expect(first.status).toBe(200)

    await addToCart(must(nftAvailable[1]).id)
    const conflict = await api.post(
      '/api/orders',
      { network: 'polygon' },
      { headers: { 'Idempotency-Key': 'edge-idem-diffbody' } }
    )
    expect(conflict.status).toBe(409)
    expect(conflict.data.error.code).toBe('IDEMPOTENCY_CONFLICT')
  })

  it('rejects a malformed idempotency key', async () => {
    await login()
    await addToCart(must(nftAvailable[0]).id)

    const res = await api.post(
      '/api/orders',
      {},
      { headers: { 'Idempotency-Key': 'bad key!' } }
    )
    expect(res.status).toBe(400)
    expect(res.data.error.code).toBe('VALIDATION_ERROR')
  })

  it('isolates an order from other users and from anonymous callers', async () => {
    await login()
    await addToCart(must(nftAvailable[0]).id)
    const order = await api.post(
      '/api/orders',
      {},
      { headers: { 'Idempotency-Key': 'edge-idem-owner' } }
    )
    expect(order.status).toBe(200)
    const orderId = order.data.data.id as string

    await login('bob@example.com', 'password123')
    expect((await api.get(`/api/orders/${orderId}`)).status).toBe(404)
    expect((await api.get(`/api/orders/${orderId}/receipt`)).status).toBe(404)

    await api.post('/api/auth/logout')
    expect((await api.get(`/api/orders/${orderId}`)).status).toBe(401)
  })

  it('never stores a registered password in clear text', async () => {
    const res = await api.post('/api/auth/register', {
      email: 'edge@example.com',
      username: 'Edge User',
      password: 'edgepass123'
    })
    expect(res.status).toBe(200)

    const account = findAccountByEmail('edge@example.com')
    expect(account).not.toBeUndefined()
    expect(account!.password).not.toBe('edgepass123')
    expect(account!.password).toBe(hashPassword('edgepass123'))

    expect((await api.post('/api/auth/login', { email: 'edge@example.com', password: 'nope' })).status).toBe(401)
    expect((await api.post('/api/auth/login', { email: 'edge@example.com', password: 'edgepass123' })).status).toBe(200)
  })

  it('enforces the per-NFT quantity maximum on add and update', async () => {
    await login()
    const nftId = must(nftAvailable[0]).id
    await addToCart(nftId, 1)

    const ok = await api.patch(`/api/cart/items/${nftId}`, { quantity: MAX_QUANTITY_PER_NFT })
    expect(ok.status).toBe(200)
    const capped = ok.data.data.find((i: { nftId: string }) => i.nftId === nftId)
    expect(capped.quantity).toBe(MAX_QUANTITY_PER_NFT)

    const overUpdate = await api.patch(`/api/cart/items/${nftId}`, {
      quantity: MAX_QUANTITY_PER_NFT + 1
    })
    expect(overUpdate.status).toBe(400)
    expect(overUpdate.data.error.code).toBe('VALIDATION_ERROR')

    const overAdd = await api.post('/api/cart/items', { nftId, quantity: 1 })
    expect(overAdd.status).toBe(400)
    expect(overAdd.data.error.code).toBe('VALIDATION_ERROR')
  })

  it('keeps a visitor cart after authentication', async () => {
    await addToCart(must(nftAvailable[0]).id, 1)
    await login()

    const cart = await api.get('/api/cart')
    expect(cart.status).toBe(200)
    expect(cart.data.data.some((i: { nftId: string }) => i.nftId === must(nftAvailable[0]).id)).toBe(true)
  })
})
