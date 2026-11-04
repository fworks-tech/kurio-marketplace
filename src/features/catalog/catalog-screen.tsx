import { useMemo } from 'react'
import { FilterSidebar } from './components/filter-sidebar'
import { CatalogTabs } from './components/catalog-tabs'
import { SortSelect } from './components/sort-select'
import { NftGrid } from './components/nft-grid'
import { CatalogPagination } from './components/catalog-pagination'
import { ErrorState } from '@/shared/ui/error-state'
import { notify } from '@/shared/ui/toast'
import type { NftSort } from '@/shared/api/api-types'
import { useFavorites } from '@/features/favorites/use-toggle-favorite'
import { useAddToCart } from '@/features/cart/cart-queries'
import { addGuestItem } from '@/features/cart/guest-cart'
import { useSession } from '@/features/session/session-queries'
import {
  CATALOG_PAGE_SIZE,
  deriveBounds,
  deriveFacets,
  toCatalogNft,
  toNftListParams,
  useCatalogFacets,
  useNftList,
  useToggleFavorite,
  type CatalogState
} from './catalog-queries'
import type { CatalogOption } from './catalog-types'

const TABS: CatalogOption[] = [
  { value: 'todos', label: 'Todos os NFTs' },
  { value: 'novos', label: 'Novos lançamentos' },
  { value: 'alta', label: 'Em alta' }
]

const SORTS: CatalogOption[] = [
  { value: 'newest', label: 'Listados recentemente' },
  { value: 'featured', label: 'Em destaque' },
  { value: 'price_asc', label: 'Menor preço' },
  { value: 'price_desc', label: 'Maior preço' },
  { value: 'name_asc', label: 'Nome (A–Z)' },
  { value: 'name_desc', label: 'Nome (Z–A)' }
]

interface CatalogScreenProps {
  state: CatalogState
  onPatch: (patch: Partial<CatalogState>) => void
  onRequireAuth: () => void
}

export function CatalogScreen({ state, onPatch, onRequireAuth }: CatalogScreenProps) {
  const list = useNftList(toNftListParams(state))
  const facetQuery = useCatalogFacets()
  const { data: session } = useSession()
  const favorites = useFavorites()
  const toggleFavorite = useToggleFavorite()
  const addToCart = useAddToCart()

  const rows = list.data?.data ?? []
  const meta = list.data?.meta
  const facets = deriveFacets(facetQuery.data)
  const bounds = useMemo(() => deriveBounds(facetQuery.data), [facetQuery.data])

  const favoriteIds = useMemo(
    () => new Set((favorites.data?.favorites ?? []).map((f) => f.id)),
    [favorites.data]
  )
  const items = rows.map((nft) => {
    const view = toCatalogNft(nft)
    return session ? { ...view, isFavorite: favoriteIds.has(nft.id) } : view
  })

  const handleToggle = (id: string) => {
    if (!session) {
      onRequireAuth()
      return
    }
    toggleFavorite.mutate({ id, remove: favoriteIds.has(id) })
  }

  const handleAddToCart = (id: string) => {
    // Visitors keep a basket of their own; it is merged into the account on sign-in.
    if (!session) {
      addGuestItem(id)
      notify.success('Salvo no carrinho. Entre para finalizar a compra.')
      return
    }
    addToCart.mutate({ nftId: id }, { onSuccess: () => notify.success('Adicionado ao carrinho.') })
  }

  const clearAll = () =>
    onPatch({
      search: '',
      collection: undefined,
      network: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      page: 1
    })

  return (
    <section id="produtos" className="mx-auto w-full max-w-[1248px] px-4 sm:px-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-12">
        <FilterSidebar
          facets={facets}
          bounds={bounds}
          values={{
            search: state.search,
            collection: state.collection,
            network: state.network,
            minPrice: state.minPrice,
            maxPrice: state.maxPrice
          }}
          onChange={(patch) => onPatch({ ...patch, page: 1 })}
        />

        <div className="min-w-0 flex-1">
          <div className="mb-8 flex flex-wrap items-start justify-between gap-4 lg:h-[18px]">
            <CatalogTabs value={state.tab} options={TABS} onChange={(tab) => onPatch({ tab, page: 1 })} />
            <SortSelect
              value={state.sort}
              options={SORTS}
              onChange={(sort) => onPatch({ sort: sort as NftSort, tab: 'todos', page: 1 })}
            />
          </div>

          {list.isError ? (
            <ErrorState message="Não foi possível carregar os NFTs." onRetry={() => list.refetch()} />
          ) : list.isLoading ? (
            <NftGrid loading skeletonCount={CATALOG_PAGE_SIZE} />
          ) : items.length === 0 ? (
            <NftGrid
              items={[]}
              emptyTitle="Nenhum NFT encontrado"
              emptyDescription="Ajuste a busca ou os filtros para ver mais resultados."
              onClearFilters={clearAll}
            />
          ) : (
            <NftGrid items={items} onToggleFavorite={handleToggle} onAddToCart={handleAddToCart} />
          )}

          {meta ? (
            <CatalogPagination
              page={meta.page}
              totalPages={meta.totalPages}
              onChange={(page) => onPatch({ page })}
              className="mt-[88px]"
            />
          ) : null}
        </div>
      </div>
    </section>
  )
}
