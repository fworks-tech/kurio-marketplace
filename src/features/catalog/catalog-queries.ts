import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { favoritesService, nftService } from '@/shared/services'
import { queryKeys } from '@/shared/lib/query-client'
import { useSession } from '@/features/session/session-queries'
import { fromMicro, toMicro } from '@/shared/api/money'
import type { NftFacets, NftListParams, NftSort, NftSummary } from '@/shared/api/api-types'
import type { PageResult } from '@/shared/api/http-client'
import type { CatalogFacets, CatalogNft } from './catalog-types'

export const CATALOG_PAGE_SIZE = 9

/** Catalog screen state, mirrored to the URL so refresh and history preserve it. */
export interface CatalogState {
  search: string
  sort: NftSort
  tab: string
  collection?: string
  network?: string
  minPrice?: number
  maxPrice?: number
  page: number
}

const TABS: Record<string, Pick<NftListParams, 'sort' | 'featured'>> = {
  todos: {},
  novos: { sort: 'newest' },
  alta: { sort: 'featured', featured: true }
}

/** Turn screen state into backend query params, letting the tab override sort when set. */
export function toNftListParams(state: CatalogState): NftListParams {
  const tabOverride = TABS[state.tab] ?? {}
  const params: NftListParams = {
    page: state.page,
    pageSize: CATALOG_PAGE_SIZE,
    search: state.search || undefined,
    collection: state.collection || undefined,
    network: state.network || undefined,
    sort: tabOverride.sort ?? state.sort,
    featured: tabOverride.featured
  }
  if (state.minPrice != null && state.minPrice > 0) params.minPrice = fromMicro(state.minPrice)
  if (state.maxPrice != null) params.maxPrice = fromMicro(state.maxPrice)
  return params
}

export function useNftList(params: NftListParams) {
  return useQuery<PageResult<NftSummary>>({
    queryKey: queryKeys.nftList(params as unknown as Record<string, unknown>),
    queryFn: ({ signal }) => nftService.list(params, { signal })
  })
}

export function useCatalogFacets() {
  return useQuery<NftFacets>({
    queryKey: queryKeys.nftFacets,
    queryFn: ({ signal }) => nftService.facets({ signal })
  })
}

export function toCatalogNft(nft: NftSummary): CatalogNft {
  return {
    id: nft.id,
    title: nft.title,
    imageUrl: nft.imageUrl,
    priceEth: nft.price,
    collection: nft.collectionId,
    badges: nft.isFeatured ? ['destaque'] : undefined,
    isAvailable: nft.isAvailable,
    isFavorite: nft.isFavorite
  }
}

/** Sidebar facets straight from the catalog-wide facet endpoint; empty until it loads. */
export function deriveFacets(facets?: NftFacets): CatalogFacets {
  return { collections: facets?.collections ?? [], networks: facets?.networks ?? [] }
}

/** Slider bounds in micro units from the catalog-wide facet endpoint, with a sane fallback. */
export function deriveBounds(facets?: NftFacets): { min: number; max: number } {
  const min = facets ? toMicro(facets.minPrice) : Number.NaN
  const max = facets ? toMicro(facets.maxPrice) : Number.NaN
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= 0) {
    return { min: 0, max: toMicro('10') }
  }
  return { min, max }
}

/** Toggle a favorite for the signed-in user; the catalog list refreshes by prefix. */
export function useToggleFavorite() {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const userId = session?.user.id ?? 'anonymous'
  return useMutation({
    mutationFn: ({ id, remove }: { id: string; remove: boolean }) =>
      remove ? favoritesService.remove(id) : favoritesService.add(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites(userId) })
      queryClient.invalidateQueries({ queryKey: ['nfts'] })
    }
  })
}
