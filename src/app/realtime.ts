import { queryClient, queryKeys } from '@/shared/lib/query-client'
import {
  createMockSocket,
  disposeMockSocket,
  reconcileOnReconnect,
  subscribeNftUpdates,
  subscribeOrderUpdates,
  type MockSocket
} from '@/shared/socket/client'
import { applyNftEventToCatalog, applyOrderEvent } from '@/shared/realtime/reducers'
import type { NftSummary, OrderSummary, NftUpdatedEvent, OrderUpdatedEvent } from '@/shared/api/api-types'
import type { PageResult } from '@/shared/api/http-client'

/** Fold an nft.updated event into cached catalog lists; detail refetches from source. */
export function applyNftEventToCache(event: NftUpdatedEvent): void {
  queryClient.setQueriesData<PageResult<NftSummary>>(
    { queryKey: ['nfts', 'list'] },
    (old) => (old ? { ...old, data: applyNftEventToCatalog(old.data, event) } : old)
  )
  // Detail carries fields the event does not (attributes, stats) — refetch from source.
  void queryClient.invalidateQueries({ queryKey: queryKeys.nftDetail(event.nftId) })
}

/** Fold an order.updated event into any cached order for that id. */
export function applyOrderEventToCache(event: OrderUpdatedEvent): void {
  queryClient.setQueriesData<OrderSummary>({ queryKey: ['orders'] }, (old) =>
    old && old.id === event.orderId ? applyOrderEvent(old, event) : old
  )
}

/** Refetch catalog and orders after a reconnect (REST is the source of truth). */
export function reconcileCaches(): void {
  void queryClient.invalidateQueries({ queryKey: ['nfts'] })
  void queryClient.invalidateQueries({ queryKey: ['orders'] })
}

let socket: MockSocket | null = null
let boundUserId: string | null = null
let pending = 0

/**
 * Connect (or re-subscribe) the realtime socket for a session.
 *
 * The socket client is imported lazily, so connecting is async; `pending`
 * discards a connection that finished after a newer connect/disconnect.
 */
export async function connectRealtime(userId: string | null): Promise<void> {
  if (socket && boundUserId === userId) return
  disconnectRealtime()
  const attempt = ++pending
  const created = await createMockSocket({ userId })
  if (attempt !== pending) {
    disposeMockSocket(created)
    return
  }
  boundUserId = userId
  socket = created
  subscribeNftUpdates(created, applyNftEventToCache)
  subscribeOrderUpdates(created, applyOrderEventToCache)
  reconcileOnReconnect(created, reconcileCaches)
}

export function disconnectRealtime(): void {
  pending += 1
  if (socket) {
    disposeMockSocket(socket)
  }
  socket = null
  boundUserId = null
}
