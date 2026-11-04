import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '@/shared/api/api-error'

export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError) {
    if (error.type === 'network' || error.type === 'timeout') return failureCount < 2
    return error.status >= 500 && failureCount < 2
  }
  return failureCount < 2
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: shouldRetryQuery,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true
    },
    mutations: {
      retry: 0
    }
  }
})

export const queryKeys = {
  session: ['session'] as const,
  nftList: (params: Record<string, unknown>) => ['nfts', 'list', params] as const,
  nftDetail: (nftId: string) => ['nfts', 'detail', nftId] as const,
  nftFacets: ['nfts', 'facets'] as const,
  favorites: (userId: string) => ['favorites', userId] as const,
  cart: (cartKey: string) => ['cart', cartKey] as const,
  order: (userId: string, orderId: string) => ['orders', userId, orderId] as const,
  profile: (userId: string) => ['profile', userId] as const,
  wallets: (userId: string) => ['wallets', userId] as const
}

export function clearSessionCaches(): void {
  // Mounted observers (the header reads the session) keep their last data when the
  // query is merely removed, so publish the signed-out state first.
  queryClient.setQueryData(queryKeys.session, null)
  queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== 'session' })
}
