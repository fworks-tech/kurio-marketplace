import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { cartService } from '@/shared/services'
import { queryKeys } from '@/shared/lib/query-client'
import { useSession } from '@/features/session/session-queries'
import { notify } from '@/shared/ui/toast'
import { clearGuestCart, guestCartCount, readGuestCart, subscribeGuestCart } from './guest-cart'
import type { GuestCartItem } from './guest-cart'

/** Live view of the visitor basket, kept in sync across tabs and mutations. */
export function useGuestCart(): GuestCartItem[] {
  const [items, setItems] = useState<GuestCartItem[]>(() => readGuestCart())

  useEffect(() => {
    setItems(readGuestCart())
    return subscribeGuestCart(() => setItems(readGuestCart()))
  }, [])

  return items
}

export function useGuestCartCount(): number {
  return guestCartCount(useGuestCart())
}

/**
 * When a visitor signs in, their basket is replayed into the account cart and the
 * storage copy is dropped. Runs once per session change so a refresh cannot merge
 * the same item twice.
 */
export function useMergeGuestCart(): void {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const merging = useRef(false)
  const userId = session?.user.id

  useEffect(() => {
    if (!userId || merging.current) return
    const pending = readGuestCart()
    if (!pending.length) return

    merging.current = true
    void (async () => {
      try {
        for (const item of pending) {
          await cartService.add({ nftId: item.nftId, quantity: item.quantity })
        }
        clearGuestCart()
        await queryClient.invalidateQueries({ queryKey: queryKeys.cart(userId) })
        notify.success(
          pending.length === 1
            ? 'O item do seu carrinho de visitante foi adicionado à sua conta.'
            : `${pending.length} itens do seu carrinho de visitante foram adicionados à sua conta.`
        )
      } catch {
        notify.error('Não foi possível recuperar o carrinho de visitante.')
      } finally {
        merging.current = false
      }
    })()
  }, [userId, queryClient])
}
