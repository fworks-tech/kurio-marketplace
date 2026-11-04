import axios from 'axios'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  cartWithItems,
  nftAvailable,
  orderPending,
  orderRejected,
  orderSuccess,
  sessionAlice,
  walletPrimary
} from '../../mocks/fixtures/index'
import { resetMockState } from '../../mocks/state/mock-state'
import { api } from '../api/http-client'
import {
  apiErrorSchema,
  authSessionSchema,
  cartItemSchema,
  cartQuoteSchema,
  nftFacetsSchema,
  nftSummarySchema,
  nftUpdatedEventSchema,
  orderSummarySchema,
  orderUpdatedEventSchema,
  walletSchema
} from './schemas'
import {
  authService,
  cartService,
  nftService,
  orderService,
  quoteService
} from '../services'
import { nftUpdateEvent, orderUpdateEvent, must } from '../../test/helpers'

const raw = axios.create({ baseURL: 'http://localhost', validateStatus: () => true })

const pageMetaSchema = {
  page: expect.any(Number),
  limit: expect.any(Number),
  total: expect.any(Number),
  totalPages: expect.any(Number)
}

describe('contract validation (Epic 22)', () => {
  beforeEach(() => {
    resetMockState()
    api.defaults.baseURL = 'http://localhost/api'
  })

  it('fixtures conform to their schemas', () => {
    for (const nft of nftAvailable) nftSummarySchema.parse(nft)
    for (const item of cartWithItems) cartItemSchema.parse(item)
    for (const order of [orderPending, orderSuccess, orderRejected]) orderSummarySchema.parse(order)
    authSessionSchema.parse(sessionAlice)
    walletSchema.parse(walletPrimary)
  })

  it('keeps the collector fields the checkout relies on', () => {
    const parsed = authSessionSchema.parse(sessionAlice)
    expect(parsed.user.displayName).toBe('Alice Neumann')
    expect(parsed.user.email).toBe('alice@example.com')
    expect(parsed.user.ensName).toBe('alicen')
  })

  it('validates catalog list responses and pagination metadata', async () => {
    const page = await nftService.list({ pageSize: 2 })
    for (const nft of page.data) nftSummarySchema.parse(nft)
    expect(page.meta).toEqual(pageMetaSchema)
    nftFacetsSchema.parse(await nftService.facets())
  })

  it('validates authenticated session and monetary cart responses', async () => {
    authSessionSchema.parse(await authService.login({ email: 'alice@example.com', password: 'password123' }))

    cartItemSchema.parse(must(await cartService.add({ nftId: must(nftAvailable[0]).id, quantity: 2 }))[0])

    cartQuoteSchema.parse(await quoteService.create({ network: 'polygon' }))
  })

  it('validates order responses across lifecycle states', async () => {
    await authService.login({ email: 'alice@example.com', password: 'password123' })
    await cartService.add({ nftId: must(nftAvailable[0]).id, quantity: 1 })
    const created = await orderService.create({ network: 'ethereum' }, { idempotencyKey: 'schema-order-1' })
    orderSummarySchema.parse(created)

    const fetched = await orderService.getById(created.id)
    orderSummarySchema.parse(fetched)
  })

  it('validates unauthorized and not-found error payloads', async () => {
    const unauth = await raw.get('/api/favorites')
    expect(unauth.status).toBe(401)
    expect(apiErrorSchema.parse(unauth.data).error.code).toBe('UNAUTHORIZED')

    const missing = await raw.get('/api/nfts/does-not-exist')
    expect(missing.status).toBe(404)
    expect(apiErrorSchema.parse(missing.data).error.code).toBe('NOT_FOUND')
  })

  it('validates idempotency-conflict error payloads', async () => {
    await authService.login({ email: 'alice@example.com', password: 'password123' })
    await cartService.add({ nftId: must(nftAvailable[0]).id, quantity: 1 })

    const headers = { 'Idempotency-Key': 'schema-idem-conflict' }
    expect((await raw.post('/api/orders', {}, { headers })).status).toBe(200)

    await cartService.add({ nftId: must(nftAvailable[1]).id, quantity: 1 })
    const conflict = await raw.post('/api/orders', {}, { headers })
    expect(conflict.status).toBe(409)
    expect(apiErrorSchema.parse(conflict.data).error.code).toBe('IDEMPOTENCY_CONFLICT')
  })

  it('enforces event payload formats and version ordering', () => {
    nftUpdatedEventSchema.parse(nftUpdateEvent(must(nftAvailable[0])))
    orderUpdatedEventSchema.parse(orderUpdateEvent(orderPending, { status: 'confirmed' }))

    expect(nftUpdatedEventSchema.safeParse(nftUpdateEvent(must(nftAvailable[0]), { version: 1.5 })).success).toBe(false)
    expect(nftUpdatedEventSchema.safeParse(nftUpdateEvent(must(nftAvailable[0]), { priceEth: 'NaN' })).success).toBe(false)
    expect(orderUpdatedEventSchema.safeParse(orderUpdateEvent(orderPending, { status: 'completed' as never })).success).toBe(false)
  })
})
