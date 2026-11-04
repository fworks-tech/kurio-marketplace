import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { favoritesService } from '@/shared/services'
import { queryKeys } from '@/shared/lib/query-client'
import { useSession } from '@/features/session/session-queries'
import type { Favorite } from '@/shared/api/api-types'

interface FavoritesPayload {
  favorites: Favorite[]
}

interface ToggleContext {
  previous?: FavoritesPayload
}

export function useFavorites() {
  const { data: session } = useSession()
  const userId = session?.user.id ?? 'anonymous'
  return useQuery<FavoritesPayload>({
    queryKey: queryKeys.favorites(userId),
    queryFn: ({ signal }) => favoritesService.list({ signal }),
    enabled: Boolean(session)
  })
}

export function useToggleFavorite(nftId: string) {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const userId = session?.user.id ?? 'anonymous'
  const key = queryKeys.favorites(userId)

  return useMutation<{ favorites: string[] }, Error, boolean, ToggleContext>({
    mutationFn: (remove) =>
      remove ? favoritesService.remove(nftId) : favoritesService.add(nftId),
    onMutate: async (remove) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<FavoritesPayload>(key)
      queryClient.setQueryData<FavoritesPayload>(key, (old) => {
        const favorites = old?.favorites ?? []
        const exists = favorites.some((favorite) => favorite.id === nftId)
        if (remove) {
          return { favorites: favorites.filter((favorite) => favorite.id !== nftId) }
        }
        if (exists) return { favorites }
        return { favorites: [...favorites, { id: nftId, isFavorite: true }] }
      })
      return { previous }
    },
    onError: (_error, _remove, context) => {
      if (context?.previous) {
        queryClient.setQueryData(key, context.previous)
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: key })
    }
  })
}
