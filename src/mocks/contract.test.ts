import axios from 'axios'
import { beforeEach, describe, expect, it } from 'vitest'
import { nftAvailable, nftSoldOut, userAlice, userBob } from './fixtures/index'
import { must } from '../test/helpers'
import {
  getMockState,
  resetMockState,
  resetToScenario,
  setUser,
  quoteStore,
  MAX_QUANTITY_PER_NFT
} from './state/mock-state'

const api = axios.create({
  baseURL: 'http://localhost',
  validateStatus: () => true
})

async function login() {
  return api.post('/api/auth/login', {
    email: 'alice@example.com',
    password: 'password123'
  })
}

/** Concatenate every page so assertions see the whole catalog despite the pageSize clamp. */
async function fetchAllNftIds(params: Record<string, string>): Promise<string[]> {
  const first = await api.get('/api/nfts', { params: { ...params, pageSize: '100', page: '1' } })
  const ids: string[] = first.data.data.map((nft: { id: string }) => nft.id)
  for (let page = 2; page <= first.data.meta.totalPages; page += 1) {
    const res = await api.get('/api/nfts', {
      params: { ...params, pageSize: '100', page: String(page) }
    })
    ids.push(...res.data.data.map((nft: { id: string }) => nft.id))
  }
  return ids
}

describe('mock API contract', () => {
  beforeEach(() => {
    resetMockState()
  })

  it('serves the NFT catalog', async () => {
    const res = await api.get('/api/nfts')

    expect(res.status).toBe(200)
    expect(res.data.success).toBe(true)
    expect(res.data.data.length).toBeGreaterThan(0)
  })

  it('supports an empty catalog scenario without leaking state', async () => {
    resetToScenario({ nfts: [], nftsSoldOut: [], nftsEmpty: true })

    const res = await api.get('/api/nfts')
    expect(res.status).toBe(200)
    expect(res.data.data).toEqual([])
    expect(res.data.meta.total).toBe(0)

    const detail = await api.get('/api/nfts/nft-001')
    expect(detail.status).toBe(404)
  })

  it('returns the documented code for missing resources', async () => {
    const res = await api.get('/api/nfts/does-not-exist')

    expect(res.status).toBe(404)
    expect(res.data.error.code).toBe('NOT_FOUND')
  })

  it('requires auth with the documented code', async () => {
    const res = await api.get('/api/favorites')

    expect(res.status).toBe(401)
    expect(res.data.error.code).toBe('UNAUTHORIZED')
  })

  it('authenticates and exposes the session', async () => {
    const loginRes = await login()
    expect(loginRes.status).toBe(200)

    const sessionRes = await api.get('/api/auth/session')
    expect(sessionRes.status).toBe(200)
    expect(sessionRes.data.data.user.username).toBe(userAlice.username)
  })

  it('validates registration fields', async () => {
    const res = await api.post('/api/auth/register', {
      username: 'ab',
      email: 'not-an-email',
      password: 'short'
    })

    expect(res.status).toBe(400)
    expect(res.data.error.code).toBe('VALIDATION_ERROR')
    expect(Object.keys(res.data.error.fieldErrors)).toEqual(
      expect.arrayContaining(['username', 'email', 'password'])
    )
  })

  it('rejects duplicate email registration with a conflict', async () => {
    const res = await api.post('/api/auth/register', {
      username: 'Alice Again',
      email: 'alice@example.com',
      password: 'password123'
    })

    expect(res.status).toBe(409)
    expect(res.data.error.code).toBe('DUPLICATE_EMAIL')
  })

  it('registers a user without exposing the password', async () => {
    const res = await api.post('/api/auth/register', {
      username: 'New Trader',
      email: 'new@example.com',
      password: 'password123'
    })

    expect(res.status).toBe(200)
    expect(res.data.data.user.username).toBe('New Trader')
    expect(JSON.stringify(res.data)).not.toContain('password')
    expect(res.data.data.user.password).toBeUndefined()
  })

  it('rejects invalid credentials', async () => {
    const res = await api.post('/api/auth/login', {
      email: 'alice@example.com',
      password: 'wrong-password'
    })

    expect(res.status).toBe(401)
    expect(res.data.error.code).toBe('INVALID_CREDENTIALS')
  })

  it('invalidates the session on logout', async () => {
    await login()
    const logout = await api.post('/api/auth/logout')
    expect(logout.status).toBe(200)

    const session = await api.get('/api/auth/session')
    expect(session.status).toBe(401)
    expect(session.data.error.code).toBe('SESSION_EXPIRED')
  })

  it('treats expired sessions as unauthorized', async () => {
    setUser(userAlice, 'token-expired', new Date(Date.now() - 1000).toISOString(), 'refresh')

    const res = await api.get('/api/auth/session')
    expect(res.status).toBe(401)
    expect(res.data.error.code).toBe('SESSION_EXPIRED')
  })

  it('switches the active session between users', async () => {
    await login()
    const bob = await api.post('/api/auth/login', {
      email: 'bob@example.com',
      password: 'password123'
    })
    expect(bob.status).toBe(200)

    const session = await api.get('/api/auth/session')
    expect(session.data.data.user.username).toBe(userBob.username)
  })

  it('adds, validates, and removes cart items', async () => {
    await login()
    const nft = must(nftAvailable[0])

    const add = await api.post('/api/cart/items', { nftId: nft.id, quantity: 1 })
    expect(add.status).toBe(200)
    expect(add.data.data).toHaveLength(1)

    const patch = await api.patch(`/api/cart/items/${nft.id}`, { quantity: 3 })
    expect(patch.status).toBe(200)
    expect(patch.data.data[0].quantity).toBe(3)

    const tooMany = await api.patch(`/api/cart/items/${nft.id}`, { quantity: 6 })
    expect(tooMany.status).toBe(400)
    expect(tooMany.data.error.code).toBe('VALIDATION_ERROR')

    const remove = await api.delete(`/api/cart/items/${nft.id}`)
    expect(remove.status).toBe(200)
    expect(remove.data.data).toHaveLength(0)
  })

  it('supports anonymous carts and merges them on login', async () => {
    const nft = must(nftAvailable[0])
    const added = await api.post('/api/cart/items', { nftId: nft.id, quantity: 2 })
    expect(added.status).toBe(200)

    const anonymousCart = await api.get('/api/cart')
    expect(anonymousCart.data.data[0].quantity).toBe(2)

    await login()
    const merged = await api.get('/api/cart')
    expect(merged.data.data).toHaveLength(1)
    expect(merged.data.data[0].quantity).toBe(2)

    await api.post('/api/auth/logout')
    const afterLogout = await api.get('/api/cart')
    expect(afterLogout.data.data).toHaveLength(0)

    await login()
    const restored = await api.get('/api/cart')
    expect(restored.data.data).toHaveLength(1)
  })

  it('isolates carts between users', async () => {
    await login()
    await api.post('/api/cart/items', { nftId: must(nftAvailable[0]).id, quantity: 1 })
    await api.post('/api/auth/logout')

    await api.post('/api/auth/login', {
      email: 'bob@example.com',
      password: 'password123'
    })
    const bobCart = await api.get('/api/cart')
    expect(bobCart.data.data).toHaveLength(0)

    await api.post('/api/auth/logout')
    await login()
    const aliceCart = await api.get('/api/cart')
    expect(aliceCart.data.data).toHaveLength(1)
  })

  it('rejects invalid cart quantities and unknown NFTs', async () => {
    const nft = must(nftAvailable[0])

    for (const quantity of [0, -1, 1.5]) {
      const res = await api.post('/api/cart/items', { nftId: nft.id, quantity })
      expect(res.status).toBe(400)
      expect(res.data.error.code).toBe('VALIDATION_ERROR')
    }

    const missing = await api.post('/api/cart/items', { nftId: 'nft-999' })
    expect(missing.status).toBe(404)
    expect(missing.data.error.code).toBe('NOT_FOUND')

    const soldOut = await api.post('/api/cart/items', { nftId: 'nft-010' })
    expect(soldOut.status).toBe(400)
    expect(soldOut.data.error.code).toBe('OUT_OF_STOCK')
  })

  it('merges duplicate items and enforces the per-NFT maximum', async () => {
    const nft = must(nftAvailable[0])
    await api.post('/api/cart/items', { nftId: nft.id, quantity: 2 })
    const second = await api.post('/api/cart/items', { nftId: nft.id, quantity: 2 })
    expect(second.data.data[0].quantity).toBe(4)

    const over = await api.post('/api/cart/items', { nftId: nft.id, quantity: 2 })
    expect(over.status).toBe(400)
    expect(over.data.error.code).toBe('VALIDATION_ERROR')

    const patched = await api.patch(`/api/cart/items/${nft.id}`, { quantity: 5 })
    expect(patched.status).toBe(200)

    const tooMany = await api.patch(`/api/cart/items/${nft.id}`, { quantity: 6 })
    expect(tooMany.status).toBe(400)
  })

  it('recalculates cart prices from the catalog on retrieval', async () => {
    const nft = must(nftAvailable[0])
    await api.post('/api/cart/items', { nftId: nft.id, quantity: 2 })

    must(getMockState().nfts[0]).price = '3'

    const res = await api.get('/api/cart')
    expect(res.data.data[0].price).toBe('3')
    expect(res.data.data[0].total).toBe('6')
  })

  it('quotes valid and invalid coupons', async () => {
    await login()
    await api.post('/api/cart/items', { nftId: must(nftAvailable[0]).id, quantity: 1 })

    const valid = await api.post('/api/cart/quote', { code: 'WELCOME10' })
    expect(valid.status).toBe(200)
    expect(valid.data.data.subtotal).toBe('2.5')
    expect(valid.data.data.discount).toBe('0.25')
    expect(valid.data.data.discountType).toBe('percentage')
    expect(valid.data.data.networkFee).toBe('0.005')
    expect(valid.data.data.total).toBe('2.255')
    expect(valid.data.data.items[0].version).toBeGreaterThan(0)
    expect(new Date(valid.data.data.expiresAt).getTime()).toBeGreaterThan(
      new Date(valid.data.data.createdAt).getTime()
    )

    const fixed = await api.post('/api/cart/quote', { code: 'FLAT5', network: 'polygon' })
    expect(fixed.status).toBe(200)
    expect(fixed.data.data.discount).toBe('0.5')
    expect(fixed.data.data.discountType).toBe('fixed')
    expect(fixed.data.data.networkFee).toBe('0.001')
    expect(fixed.data.data.total).toBe('2.001')

    const invalid = await api.post('/api/cart/quote', { code: 'NOPE' })
    expect(invalid.status).toBe(400)
    expect(invalid.data.error.code).toBe('INVALID_COUPON')

    const expired = await api.post('/api/cart/quote', { code: 'EXPIRED20' })
    expect(expired.status).toBe(410)
    expect(expired.data.error.code).toBe('EXPIRED_COUPON')

    const network = await api.post('/api/cart/quote', { network: 'dogecoin' })
    expect(network.status).toBe(400)
  })

  it('rejects quotes for empty carts and invalid quantities', async () => {
    const empty = await api.post('/api/cart/quote', {})
    expect(empty.status).toBe(400)
    expect(empty.data.error.code).toBe('VALIDATION_ERROR')

    await api.post('/api/cart/items', { nftId: must(nftAvailable[0]).id, quantity: 1 })
    must(getMockState().cart[0]).quantity = MAX_QUANTITY_PER_NFT + 1

    const over = await api.post('/api/cart/quote', {})
    expect(over.status).toBe(400)
    expect(over.data.error.code).toBe('VALIDATION_ERROR')
  })

  it('detects stale quotes after price or version changes', async () => {
    await api.post('/api/cart/items', { nftId: must(nftAvailable[0]).id, quantity: 1 })
    const quote = await api.post('/api/cart/quote', {})
    expect(quote.status).toBe(200)

    const reused = await api.post('/api/cart/quote', { quoteId: quote.data.data.id })
    expect(reused.status).toBe(200)
    expect(reused.data.data.id).toBe(quote.data.data.id)

    must(getMockState().nfts[0]).price = '3'
    const stale = await api.post('/api/cart/quote', { quoteId: quote.data.data.id })
    expect(stale.status).toBe(409)
    expect(stale.data.error.code).toBe('PRICE_CHANGED')

    const fresh = await api.post('/api/cart/quote', {})
    must(getMockState().nfts[0]).version = (must(nftAvailable[0]).version ?? 1) + 1
    const versionStale = await api.post('/api/cart/quote', { quoteId: fresh.data.data.id })
    expect(versionStale.status).toBe(409)
    expect(versionStale.data.error.code).toBe('PRICE_CHANGED')

    const missing = await api.post('/api/cart/quote', { quoteId: 'quote-missing' })
    expect(missing.status).toBe(404)

    const couponQuote = await api.post('/api/cart/quote', { code: 'WELCOME10' })
    const stored = quoteStore.get(couponQuote.data.data.id)
    expect(stored).toBeDefined()
    stored!.couponCode = 'EXPIRED20'

    const couponStale = await api.post('/api/cart/quote', { quoteId: stored!.id })
    expect(couponStale.status).toBe(410)
    expect(couponStale.data.error.code).toBe('EXPIRED_COUPON')
  })

  it('detects stale quotes after availability changes', async () => {
    await api.post('/api/cart/items', { nftId: must(nftAvailable[0]).id, quantity: 1 })
    const quote = await api.post('/api/cart/quote', {})
    expect(quote.status).toBe(200)

    getMockState().nfts = getMockState().nfts.filter((nft) => nft.id !== must(nftAvailable[0]).id)
    getMockState().nftsSoldOut.push({ ...must(nftAvailable[0]), isAvailable: false })

    const stale = await api.post('/api/cart/quote', { quoteId: quote.data.data.id })
    expect(stale.status).toBe(409)
    expect(stale.data.error.code).toBe('OUT_OF_STOCK')
  })

  it('manages favorites idempotently', async () => {
    await login()
    expect((await api.get('/api/favorites')).data.data.favorites).toEqual([])

    const added = await api.post(`/api/favorites/${must(nftAvailable[0]).id}`)
    expect(added.status).toBe(200)

    const duplicate = await api.post(`/api/favorites/${must(nftAvailable[0]).id}`)
    expect(duplicate.status).toBe(200)
    expect(duplicate.data.data.favorites).toEqual([must(nftAvailable[0]).id])

    const list = await api.get('/api/favorites')
    expect(list.data.data.favorites).toHaveLength(1)
    expect(list.data.data.favorites[0].id).toBe(must(nftAvailable[0]).id)

    const removed = await api.delete(`/api/favorites/${must(nftAvailable[0]).id}`)
    expect(removed.status).toBe(200)
    expect(removed.data.data.favorites).toEqual([])

    const again = await api.delete(`/api/favorites/${must(nftAvailable[0]).id}`)
    expect(again.status).toBe(404)

    const unknown = await api.post('/api/favorites/nft-999')
    expect(unknown.status).toBe(404)
  })

  it('isolates favorites between users', async () => {
    await login()
    await api.post(`/api/favorites/${must(nftAvailable[0]).id}`)
    await api.post('/api/auth/logout')

    await api.post('/api/auth/login', {
      email: 'bob@example.com',
      password: 'password123'
    })
    expect((await api.get('/api/favorites')).data.data.favorites).toHaveLength(0)
    await api.post(`/api/favorites/${must(nftAvailable[1]).id}`)

    await api.post('/api/auth/logout')
    await login()
    const alice = await api.get('/api/favorites')
    expect(alice.data.data.favorites.map((favorite: { id: string }) => favorite.id)).toEqual([
      must(nftAvailable[0]).id
    ])
  })

  it('reports favorite mutation failures without changing state', async () => {
    await login()
    const added = await api.post(`/api/favorites/${must(nftAvailable[0]).id}`)
    expect(added.status).toBe(200)

    const failedAdd = await api.post(
      `/api/favorites/${must(nftAvailable[1]).id}`,
      {},
      { headers: { 'x-mock-fail': 'true' } }
    )
    expect(failedAdd.status).toBe(500)
    expect((await api.get('/api/favorites')).data.data.favorites).toHaveLength(1)

    const failedRemove = await api.delete(`/api/favorites/${must(nftAvailable[0]).id}`, {
      headers: { 'x-mock-fail': 'true' }
    })
    expect(failedRemove.status).toBe(500)
    expect((await api.get('/api/favorites')).data.data.favorites).toHaveLength(1)
  })

  it('creates an idempotent order, replays it, and serves its receipt', async () => {
    await login()
    await api.post('/api/cart/items', { nftId: must(nftAvailable[0]).id, quantity: 1 })
    const headers = { 'Idempotency-Key': 'contract-key-1' }

    const first = await api.post('/api/orders', {}, { headers })
    expect(first.status).toBe(200)
    const orderId = first.data.data.id

    const replay = await api.post('/api/orders', {}, { headers })
    expect(replay.status).toBe(200)
    expect(replay.data.data.id).toBe(orderId)

    const fetched = await api.get(`/api/orders/${orderId}`)
    expect(fetched.status).toBe(200)
    expect(fetched.data.data.id).toBe(orderId)

    const receipt = await api.get(`/api/orders/${orderId}/receipt`)
    expect(receipt.status).toBe(200)
    expect(receipt.data.data.id).toBe(orderId)
  })

  it('returns conflict for same idempotency key with different payload', async () => {
    await login()
    await api.post('/api/cart/items', { nftId: must(nftAvailable[0]).id, quantity: 1 })
    const headers = { 'Idempotency-Key': 'contract-key-conflict' }

    const first = await api.post('/api/orders', {}, { headers })
    expect(first.status).toBe(200)

    await api.post('/api/cart/items', { nftId: must(nftAvailable[1]).id, quantity: 1 })
    const conflict = await api.post('/api/orders', {}, { headers })
    expect(conflict.status).toBe(409)
    expect(conflict.data.error.code).toBe('IDEMPOTENCY_CONFLICT')
  })

  it('validates empty cart before order creation', async () => {
    resetMockState()
    await login()

    const headers = { 'Idempotency-Key': 'contract-key-empty' }
    const empty = await api.post('/api/orders', {}, { headers })
    expect(empty.status).toBe(400)
    expect(empty.data.error.code).toBe('VALIDATION_ERROR')
  })

  it('recovers the order after a simulated timeout', async () => {
    await login()
    await api.post('/api/cart/items', { nftId: must(nftAvailable[0]).id, quantity: 1 })
    const headers = { 'Idempotency-Key': 'contract-key-timeout' }

    const timedOut = await api.post(
      '/api/orders',
      {},
      { headers: { ...headers, 'x-mock-timeout': 'true' } }
    )
    expect(timedOut.status).toBe(504)
    expect(timedOut.data.error.code).toBe('ORDER_TIMEOUT')

    const recovered = await api.post('/api/orders', {}, { headers })
    expect(recovered.status).toBe(200)
    expect(recovered.data.data.nft.id).toBe(must(nftAvailable[0]).id)
  })

  it('orders the whole cart with quote-consistent fees and coupon', async () => {
    await login()
    const first = must(nftAvailable[0]); const second = must(nftAvailable[1])
    await api.post('/api/cart/items', { nftId: first.id, quantity: 1 })
    await api.post('/api/cart/items', { nftId: second.id, quantity: 2 })

    const order = await api.post(
      '/api/orders',
      { network: 'polygon', code: 'WELCOME10' },
      { headers: { 'Idempotency-Key': 'contract-key-multi' } }
    )
    expect(order.status).toBe(200)
    expect(order.data.data.items).toHaveLength(2)
    expect(order.data.data.network).toBe('polygon')
    expect(order.data.data.couponCode).toBe('WELCOME10')
    expect(order.data.data.fee).toBe('0.001')
    expect(order.data.data.discount).not.toBe('0')

    const cart = await api.get('/api/cart')
    expect(cart.data.data).toHaveLength(0)
  })

  it('rejects invalid coupons and networks for orders', async () => {
    await login()
    await api.post('/api/cart/items', { nftId: must(nftAvailable[0]).id, quantity: 1 })

    const badCoupon = await api.post(
      '/api/orders',
      { code: 'NOPE' },
      { headers: { 'Idempotency-Key': 'contract-key-bad-coupon' } }
    )
    expect(badCoupon.status).toBe(400)
    expect(badCoupon.data.error.code).toBe('INVALID_COUPON')

    const expired = await api.post(
      '/api/orders',
      { code: 'EXPIRED20' },
      { headers: { 'Idempotency-Key': 'contract-key-expired-coupon' } }
    )
    expect(expired.status).toBe(410)
    expect(expired.data.error.code).toBe('EXPIRED_COUPON')

    const badNetwork = await api.post(
      '/api/orders',
      { network: 'solana' },
      { headers: { 'Idempotency-Key': 'contract-key-bad-network' } }
    )
    expect(badNetwork.status).toBe(400)

    const cart = await api.get('/api/cart')
    expect(cart.data.data).toHaveLength(1)
  })

  it('assigns unique order ids across requests', async () => {
    await login()

    await api.post('/api/cart/items', { nftId: must(nftAvailable[0]).id, quantity: 1 })
    const first = await api.post(
      '/api/orders',
      {},
      { headers: { 'Idempotency-Key': 'contract-key-seq-1' } }
    )
    await api.post('/api/cart/items', { nftId: must(nftAvailable[1]).id, quantity: 1 })
    const second = await api.post(
      '/api/orders',
      {},
      { headers: { 'Idempotency-Key': 'contract-key-seq-2' } }
    )

    expect(first.data.data.id).not.toBe(second.data.data.id)
  })

  it('returns receipt with immutable purchase-time snapshot', async () => {
    await login()
    await api.post('/api/cart/items', { nftId: must(nftAvailable[0]).id, quantity: 1 })
    const headers = { 'Idempotency-Key': 'contract-key-receipt' }

    const first = await api.post('/api/orders', {}, { headers })
    expect(first.status).toBe(200)
    const orderId = first.data.data.id

    const receipt = await api.get(`/api/orders/${orderId}/receipt`)
    expect(receipt.status).toBe(200)
    expect(receipt.data.data.nft.id).toBe(must(nftAvailable[0]).id)
    expect(receipt.data.data.price).toBe(must(nftAvailable[0]).price)
    expect(receipt.data.data.fee).toBeDefined()
    expect(receipt.data.data.total).toBeDefined()
    expect(receipt.data.data.buyer).toBeDefined()
  })

  it('persists profile updates', async () => {
    await login()

    const updated = await api.patch('/api/profile', { avatar: '/avatar-new.png' })
    expect(updated.status).toBe(200)
    expect(updated.data.data.avatar).toBe('/avatar-new.png')

    const session = await api.get('/api/auth/session')
    expect(session.data.data.user.avatar).toBe('/avatar-new.png')
  })

  it('validates profile fields and never returns passwords', async () => {
    await login()

    const invalid = await api.patch('/api/profile', { username: 'ab' })
    expect(invalid.status).toBe(400)
    expect(invalid.data.error.fieldErrors.username).toBeDefined()

    const profile = await api.get('/api/profile')
    expect(profile.data.data).not.toHaveProperty('password')
    expect(profile.data.data.username).toBe(userAlice.username)
  })

  it('isolates profile changes between users', async () => {
    await login()
    await api.patch('/api/profile', { username: 'AliceRenamed' })

    await api.post('/api/auth/logout')
    await api.post('/api/auth/login', {
      email: 'bob@example.com',
      password: 'password123'
    })
    expect((await api.get('/api/profile')).data.data.username).toBe(userBob.username)

    await api.post('/api/auth/logout')
    await login()
    expect((await api.get('/api/profile')).data.data.username).toBe('AliceRenamed')
  })

  it('updates avatars and changes passwords', async () => {
    await login()

    const avatar = await api.post('/api/profile/avatar', { avatar: '/avatar-new.png' })
    expect(avatar.status).toBe(200)
    expect(avatar.data.data.avatar).toBe('/avatar-new.png')

    const missing = await api.post('/api/profile/avatar', {})
    expect(missing.status).toBe(400)

    const wrong = await api.post('/api/profile/password', {
      currentPassword: 'wrong-password',
      newPassword: 'newpassword123'
    })
    expect(wrong.status).toBe(400)
    expect(wrong.data.error.fieldErrors.currentPassword).toBeDefined()

    const changed = await api.post('/api/profile/password', {
      currentPassword: 'password123',
      newPassword: 'newpassword123'
    })
    expect(changed.status).toBe(200)

    await api.post('/api/auth/logout')
    const oldLogin = await api.post('/api/auth/login', {
      email: 'alice@example.com',
      password: 'password123'
    })
    expect(oldLogin.status).toBe(401)

    const newLogin = await api.post('/api/auth/login', {
      email: 'alice@example.com',
      password: 'newpassword123'
    })
    expect(newLogin.status).toBe(200)
  })

  it('lists, creates, and validates wallets', async () => {
    await login()

    const list = await api.get('/api/wallets')
    expect(list.status).toBe(200)
    expect(list.data.data).toHaveLength(1)
    expect(list.data.data[0].isPrimary).toBe(true)

    const invalid = await api.post('/api/wallets', {
      address: '0x1234',
      label: 'Bad',
      network: 'ethereum'
    })
    expect(invalid.status).toBe(400)
    expect(invalid.data.error.fieldErrors.address).toBeDefined()
    expect(invalid.data.error.fieldErrors.network).toBeDefined()

    const address = '0x' + 'a'.repeat(40)
    const created = await api.post('/api/wallets', {
      address,
      label: 'Trading',
      network: 'Polygon'
    })
    expect(created.status).toBe(200)
    expect(created.data.data.isPrimary).toBe(false)

    const duplicate = await api.post('/api/wallets', {
      address,
      label: 'Again',
      network: 'Polygon'
    })
    expect(duplicate.status).toBe(409)
  })

  it('promotes a secondary wallet and keeps a single primary', async () => {
    await login()
    const created = await api.post('/api/wallets', {
      address: '0x' + 'b'.repeat(40),
      label: 'Trading',
      network: 'Polygon'
    })

    const promoted = await api.patch(`/api/wallets/${created.data.data.id}`, {
      isPrimary: true
    })
    expect(promoted.status).toBe(200)

    const list = await api.get('/api/wallets')
    const primaries = list.data.data.filter((wallet: { isPrimary: boolean }) => wallet.isPrimary)
    expect(primaries).toHaveLength(1)
    expect(primaries[0].id).toBe(created.data.data.id)

    await api.post('/api/auth/logout')
    await login()
    const after = await api.get('/api/wallets')
    const afterPrimary = after.data.data.filter(
      (wallet: { isPrimary: boolean }) => wallet.isPrimary
    )
    expect(afterPrimary[0].id).toBe(created.data.data.id)
  })

  it('prevents cross-user wallet access', async () => {
    await login()
    await api.post('/api/auth/logout')

    await api.post('/api/auth/login', {
      email: 'bob@example.com',
      password: 'password123'
    })
    const bobWallet = await api.post('/api/wallets', {
      address: '0x' + 'c'.repeat(40),
      label: 'Bob Wallet',
      network: 'Polygon'
    })

    await api.post('/api/auth/logout')
    await login()
    const hijack = await api.patch(`/api/wallets/${bobWallet.data.data.id}`, {
      label: 'Hijacked'
    })
    expect(hijack.status).toBe(404)
  })

  it('rejects unauthenticated wallet access', async () => {
    const res = await api.get('/api/wallets')
    expect(res.status).toBe(401)
    expect(res.data.error.code).toBe('UNAUTHORIZED')
  })

  it('filters catalog by search and collection', async () => {
    const search = await api.get('/api/nfts', { params: { search: 'lotus' } })
    expect(search.data.data.map((nft: { id: string }) => nft.id)).toEqual(['nft-003'])

    const collection = await api.get('/api/nfts', {
      params: { collection: 'arte-digital', pageSize: '100' }
    })
    const collectionIds = collection.data.data.map((nft: { id: string }) => nft.id)
    expect(collectionIds).toContain('nft-003')
    expect(collectionIds).toContain('nft-001')
    expect(
      collection.data.data.every((nft: { collectionId?: string }) => nft.collectionId === 'arte-digital')
    ).toBe(true)

    const combined = await api.get('/api/nfts', {
      params: { search: 'ape', collection: 'arte-digital', pageSize: '100' }
    })
    expect(combined.data.data.map((nft: { id: string }) => nft.id)).toEqual(['nft-001'])
  })

  it('filters catalog by network', async () => {
    const res = await api.get('/api/nfts', { params: { network: 'Polygon', pageSize: '100' } })

    expect(res.data.meta.total).toBe(78)
    expect(res.data.data.every((nft: { network?: string }) => nft.network === 'Polygon')).toBe(true)
    expect(res.data.data.map((nft: { id: string }) => nft.id)).toContain('nft-002')
  })

  it('serves catalog facets matching the sidebar design', async () => {
    const res = await api.get('/api/nfts/facets')

    expect(res.status).toBe(200)
    const data = res.data.data
    expect(data.collections.map((facet: { label: string }) => facet.label)).toEqual([
      'Arte digital',
      'Fotografia',
      'Música',
      'Arte 3D',
      'Colecionáveis',
      'Generativa',
      'Jogos',
      'Assinaturas',
      'Utilidade'
    ])
    expect(data.collections.map((facet: { count: number }) => facet.count)).toEqual([
      40, 14, 77, 46, 27, 20, 23, 16, 19
    ])
    expect(data.collections.reduce((sum: number, facet: { count: number }) => sum + facet.count, 0)).toBe(
      nftAvailable.length
    )
    expect(data.networks.map((facet: { value: string }) => facet.value)).toEqual([
      'Ethereum',
      'Polygon',
      'Solana'
    ])
    expect(data.networks.map((facet: { count: number }) => facet.count)).toEqual([119, 78, 86])
    expect(data.minPrice).toBe('0.02')
    expect(data.maxPrice).toBe('12.3')
  })

  it('filters catalog by price, availability, and featured flags', async () => {
    const priced = await api.get('/api/nfts', { params: { minPrice: '2', maxPrice: '3' } })
    expect(priced.data.data.map((nft: { id: string }) => nft.id)).toEqual(['nft-001'])

    const soldOut = await api.get('/api/nfts', { params: { availability: 'false' } })
    expect(soldOut.data.data.map((nft: { id: string }) => nft.id)).toEqual(['nft-010'])

    const featured = await api.get('/api/nfts', { params: { featured: 'true' } })
    const featuredIds = featured.data.data.map((nft: { id: string }) => nft.id)
    expect(featuredIds).toContain('nft-002')
    expect(featuredIds).toContain('nft-001')
    expect(featured.data.data.every((nft: { isFeatured: boolean }) => nft.isFeatured)).toBe(true)
  })

  it('sorts catalog deterministically', async () => {
    const known = ['nft-001', 'nft-002', 'nft-003', 'nft-010']
    const cases: [string, string[]][] = [
      ['price_asc', ['nft-010', 'nft-003', 'nft-001', 'nft-002']],
      ['price_desc', ['nft-002', 'nft-001', 'nft-003', 'nft-010']],
      ['name_asc', ['nft-001', 'nft-010', 'nft-003', 'nft-002']],
      ['name_desc', ['nft-002', 'nft-003', 'nft-010', 'nft-001']],
      ['newest', ['nft-003', 'nft-002', 'nft-001', 'nft-010']],
      ['featured', ['nft-002', 'nft-001', 'nft-003', 'nft-010']]
    ]

    for (const [sort, expected] of cases) {
      const ids = (await fetchAllNftIds({ sort })).filter((id) => known.includes(id))
      expect(ids, sort).toEqual(expected)
    }
  })

  it('paginates and normalizes invalid pagination params', async () => {
    const total = nftAvailable.length + nftSoldOut.length
    const all = await api.get('/api/nfts', { params: { sort: 'price_asc', pageSize: '100' } })

    const page = await api.get('/api/nfts', {
      params: { sort: 'price_asc', page: '2', pageSize: '2' }
    })
    expect(page.data.meta).toMatchObject({
      page: 2,
      limit: 2,
      total,
      totalPages: Math.ceil(total / 2)
    })
    expect(page.data.data.map((nft: { id: string }) => nft.id)).toEqual(
      all.data.data.slice(2, 4).map((nft: { id: string }) => nft.id)
    )

    const invalid = await api.get('/api/nfts', { params: { page: 'abc', pageSize: '-5' } })
    expect(invalid.data.meta).toMatchObject({
      page: 1,
      limit: 20,
      total,
      totalPages: Math.ceil(total / 20)
    })

    const clamped = await api.get('/api/nfts', { params: { pageSize: '999' } })
    expect(clamped.data.meta.limit).toBe(100)
  })

  it('returns typed NFT details including sold-out items', async () => {
    const detail = await api.get('/api/nfts/nft-001')
    expect(detail.status).toBe(200)
    expect(detail.data.data.stats).toBeDefined()
    expect(detail.data.data.version).toBe(1)
    expect(detail.data.data.isFeatured).toBe(true)

    const soldOut = await api.get('/api/nfts/nft-010')
    expect(soldOut.status).toBe(200)
    expect(soldOut.data.data.isAvailable).toBe(false)
  })
})
