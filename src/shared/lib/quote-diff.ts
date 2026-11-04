import type { CartQuote } from '@/shared/api/api-types'
import { toMicro } from '@/shared/api/money'

export interface QuoteChanges {
  price: boolean
  availability: boolean
  coupon: boolean
  fee: boolean
}

const LABELS: Record<keyof QuoteChanges, string> = {
  price: 'O preço dos itens mudou.',
  availability: 'A disponibilidade de um item mudou.',
  coupon: 'O cupom aplicado mudou.',
  fee: 'A taxa de rede mudou.'
}

function membership(quote: CartQuote): string {
  return quote.items
    .map((item) => `${item.nftId}:${item.quantity}`)
    .sort()
    .join('|')
}

/** Compares two quotes in micro-units so the diff never runs on floats. */
export function diffQuote(prev: CartQuote, next: CartQuote): QuoteChanges {
  return {
    price: toMicro(prev.subtotal) !== toMicro(next.subtotal),
    availability: membership(prev) !== membership(next),
    coupon: (prev.couponCode ?? '') !== (next.couponCode ?? ''),
    fee: toMicro(prev.networkFee) !== toMicro(next.networkFee)
  }
}

export function hasQuoteChanges(changes: QuoteChanges): boolean {
  return changes.price || changes.availability || changes.coupon || changes.fee
}

export function describeQuoteChanges(changes: QuoteChanges): string[] {
  return (Object.keys(changes) as (keyof QuoteChanges)[])
    .filter((key) => changes[key])
    .map((key) => LABELS[key])
}
