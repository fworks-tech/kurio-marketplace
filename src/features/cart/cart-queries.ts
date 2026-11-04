import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { cartService, quoteService } from '@/shared/services'
import { queryKeys } from '@/shared/lib/query-client'
import { useSession } from '@/features/session/session-queries'
import type { CartItem, CartQuote } from '@/shared/api/api-types'

/** Cart is scoped to the session; anonymous carts are not persisted by the backend. */
export function useCartKey(): string {
  const { data: session } = useSession()
  return session?.user.id ?? 'anonymous'
}

export function useCart() {
  const { data: session } = useSession()
  const key = useCartKey()
  return useQuery<CartItem[]>({
    queryKey: queryKeys.cart(key),
    queryFn: ({ signal }) => cartService.get({ signal }),
    enabled: Boolean(session)
  })
}

function useCartMutation<TVariables>(mutationFn: (variables: TVariables) => Promise<CartItem[]>) {
  const queryClient = useQueryClient()
  const key = useCartKey()
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.cart(key) })
  })
}

export function useAddToCart() {
  return useCartMutation(({ nftId, quantity }: { nftId: string; quantity?: number }) =>
    cartService.add({ nftId, quantity })
  )
}

export function useUpdateCartQuantity() {
  return useCartMutation(({ nftId, quantity }: { nftId: string; quantity: number }) =>
    cartService.updateQuantity(nftId, { quantity })
  )
}

export function useRemoveCartItem() {
  return useCartMutation((nftId: string) => cartService.remove(nftId))
}

/** Quote is the only source of truth for subtotal, discount, fee and total. */
export function useQuote(code: string | undefined) {
  const { data: session } = useSession()
  const key = useCartKey()
  return useQuery<CartQuote>({
    queryKey: [...queryKeys.cart(key), 'quote', code ?? ''],
    queryFn: ({ signal }) => quoteService.create(code ? { code } : {}, { signal }),
    enabled: Boolean(session)
  })
}

/** Editions still purchasable for a cart line, floored at 1 so the stepper stays usable. */
export function cartLineMax(item: CartItem): number {
  return Math.max(1, item.nft.totalEdition - item.nft.edition)
}

