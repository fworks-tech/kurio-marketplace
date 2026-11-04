/**
 * Framework-agnostic real-time reducers.
 *
 * These functions are safe to call for duplicate or outdated events: versions
 * only move forward and terminal order states never regress.
 */

import type {
  CartQuote,
  NftSummary,
  NftUpdatedEvent,
  OrderSummary,
  OrderUpdatedEvent
} from '../api/api-types'

function isNewer(eventVersion: number, currentVersion: number | undefined): boolean {
  return eventVersion > (currentVersion ?? 0)
}

/** Apply an NFT event to a catalog/detail cache entry */
export function applyNftEvent(nft: NftSummary, event: NftUpdatedEvent): NftSummary {
  if (nft.id !== event.nftId || !isNewer(event.version, nft.version)) {
    return nft
  }

  return {
    ...nft,
    price: event.priceEth,
    isAvailable: event.availability > 0,
    version: event.version,
    updatedAt: event.updatedAt
  }
}

/** Apply an NFT event to a catalog list */
export function applyNftEventToCatalog(
  nfts: NftSummary[],
  event: NftUpdatedEvent
): NftSummary[] {
  let changed = false
  const next = nfts.map((nft) => {
    const updated = applyNftEvent(nft, event)
    if (updated !== nft) changed = true
    return updated
  })
  return changed ? next : nfts
}

/** Apply an order event without regressing a terminal state */
export function applyOrderEvent(order: OrderSummary, event: OrderUpdatedEvent): OrderSummary {
  if (order.id !== event.orderId || !isNewer(event.version, order.version)) {
    return order
  }

  const terminal =
    order.status === 'confirmed' || order.status === 'rejected' || order.status === 'completed'
  if (terminal && event.status !== order.status) {
    return order
  }

  return {
    ...order,
    status: event.status,
    version: event.version,
    transactionId: event.transactionId ?? order.transactionId,
    explorerUrl: event.explorerUrl ?? order.explorerUrl
  }
}

/** Check whether an NFT event invalidates a quote */
export function isQuoteStale(quote: CartQuote, event: NftUpdatedEvent): boolean {
  return quote.items.some(
    (item) =>
      item.nftId === event.nftId &&
      (item.version !== event.version || item.unitPrice !== event.priceEth)
  )
}
