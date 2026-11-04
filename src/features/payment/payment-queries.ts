import { useQuery } from '@tanstack/react-query'
import { orderService, profileService, quoteService, walletService } from '@/shared/services'
import { queryKeys } from '@/shared/lib/query-client'
import { useSession } from '@/features/session/session-queries'
import type { CartQuote, OrderSummary, QuoteNetwork, UserSummary, Wallet } from '@/shared/api/api-types'

const NETWORKS: QuoteNetwork[] = ['ethereum', 'polygon', 'base']

export const CHECKOUT_NETWORKS = NETWORKS

export function checkoutQuoteKey(cartKey: string, network: QuoteNetwork, code?: string) {
  return [...queryKeys.cart(cartKey), 'quote', code ?? '', network] as const
}

/** Checkout quote is the source of truth for fees/total and varies with the selected network. */
export function useCheckoutQuote(network: QuoteNetwork, code?: string) {
  const { data: session } = useSession()
  const key = session?.user.id ?? 'anonymous'
  return useQuery<CartQuote>({
    queryKey: checkoutQuoteKey(key, network, code),
    queryFn: ({ signal }) => quoteService.create(code ? { code, network } : { network }, { signal }),
    enabled: Boolean(session)
  })
}

export function useWallets() {
  const { data: session } = useSession()
  const key = session?.user.id ?? 'anonymous'
  return useQuery<Wallet[]>({
    queryKey: queryKeys.wallets(key),
    queryFn: ({ signal }) => walletService.list({ signal }),
    enabled: Boolean(session)
  })
}

export function useProfile() {
  const { data: session } = useSession()
  const key = session?.user.id ?? 'anonymous'
  return useQuery<UserSummary>({
    queryKey: queryKeys.profile(key),
    queryFn: ({ signal }) => profileService.get({ signal }),
    enabled: Boolean(session)
  })
}

export function useOrder(orderId: string) {
  const { data: session } = useSession()
  const key = session?.user.id ?? 'anonymous'
  return useQuery<OrderSummary>({
    queryKey: queryKeys.order(key, orderId),
    queryFn: ({ signal }) => orderService.getById(orderId, { signal }),
    enabled: Boolean(session && orderId)
  })
}
