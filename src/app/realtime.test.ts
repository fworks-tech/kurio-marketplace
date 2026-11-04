import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  applyNftEventToCache,
  applyOrderEventToCache
} from '@/app/realtime'
import { queryClient, queryKeys } from '@/shared/lib/query-client'
import { nftAvailable, orderPending } from '@/mocks/fixtures/index'
import { must } from '@/test/helpers'
import type { NftSummary, OrderSummary, NftUpdatedEvent, OrderUpdatedEvent } from '@/shared/api/api-types'
import type { PageResult } from '@/shared/api/http-client'

const meta = { page: 1, limit: 20, total: 1, totalPages: 1 }
const listKey = queryKeys.nftList({ page: 1 })

const nftEvent = (over: Partial<NftUpdatedEvent> = {}): NftUpdatedEvent => ({
  nftId: 'nft-001',
  version: 2,
  priceEth: '4.25',
  availability: 4,
  updatedAt: '2024-03-02T00:00:00Z',
  ...over
})

const orderEvent = (over: Partial<OrderUpdatedEvent> = {}): OrderUpdatedEvent => ({
  orderId: orderPending.id,
  version: 2,
  status: 'confirmed',
  updatedAt: '2024-03-02T00:00:00Z',
  ...over
})

describe('realtime cache wiring', () => {
  afterEach(() => {
    queryClient.clear()
    vi.restoreAllMocks()
  })

  it('folds a newer nft.updated into the catalog list cache', () => {
    const stale: NftSummary = { ...must(nftAvailable[0]), version: 1, price: '3.0' }
    queryClient.setQueryData<PageResult<NftSummary>>(listKey, { data: [stale], meta })

    applyNftEventToCache(nftEvent())

    const cached = must(queryClient.getQueryData<PageResult<NftSummary>>(listKey))
    expect(must(cached.data[0]).price).toBe('4.25')
    expect(must(cached.data[0]).version).toBe(2)
  })

  it('leaves the catalog untouched for an outdated nft.updated version', () => {
    const current: NftSummary = { ...must(nftAvailable[0]), version: 9, price: '8.8' }
    queryClient.setQueryData<PageResult<NftSummary>>(listKey, { data: [current], meta })

    applyNftEventToCache(nftEvent({ version: 3, priceEth: '1.0' }))

    const cached = must(queryClient.getQueryData<PageResult<NftSummary>>(listKey))
    expect(must(cached.data[0]).price).toBe('8.8')
  })

  it('invalidates the NFT detail query on update', () => {
    const spy = vi.spyOn(queryClient, 'invalidateQueries')
    applyNftEventToCache(nftEvent({ nftId: 'nft-002' }))
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.nftDetail('nft-002') })
  })

  it('folds a newer order.updated into the matching order cache', () => {
    const cached: OrderSummary = { ...orderPending, version: 1, status: 'pending' }
    queryClient.setQueryData<OrderSummary>(queryKeys.order('user-alice', cached.id), cached)

    applyOrderEventToCache(orderEvent({ transactionId: '0xabc' }))

    const next = must(queryClient.getQueryData<OrderSummary>(queryKeys.order('user-alice', cached.id)))
    expect(next.status).toBe('confirmed')
    expect(next.transactionId).toBe('0xabc')
  })

  it('ignores an order.updated for a different id', () => {
    const cached: OrderSummary = { ...orderPending, version: 1, status: 'pending' }
    const key = queryKeys.order('user-alice', cached.id)
    queryClient.setQueryData<OrderSummary>(key, cached)

    applyOrderEventToCache(orderEvent({ orderId: 'order-999' }))

    expect(queryClient.getQueryData<OrderSummary>(key)?.status).toBe('pending')
  })
})
