import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { CatalogScreen } from '@/features/catalog/catalog-screen'
import { useAuthDialog } from '@/features/auth/auth-dialog'
import { HomeHero } from '@/features/catalog/components/home-hero'
import { MobileCatalogBar } from '@/features/catalog/components/mobile-catalog-bar'
import { HomePromos } from '@/features/catalog/components/home-promos'
import { HomeBlog } from '@/features/catalog/components/home-blog'
import { type CatalogState } from '@/features/catalog/catalog-queries'
import type { NftSort } from '@/shared/api/api-types'

const SORTS: NftSort[] = ['price_asc', 'price_desc', 'name_asc', 'name_desc', 'featured', 'newest']

/** URL shape — every key optional so existing `<Link to="/">` need no `search`. */
interface CatalogSearch {
  q?: string
  sort?: NftSort
  tab?: string
  collection?: string
  network?: string
  min?: number
  max?: number
  page?: number
}

function numberOrUndefined(value: unknown): number | undefined {
  if (value === undefined) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function validateSearch(search: Record<string, unknown>): CatalogSearch {
  const out: CatalogSearch = {}
  if (typeof search.q === 'string' && search.q) out.q = search.q
  if (SORTS.includes(search.sort as NftSort)) out.sort = search.sort as NftSort
  if (typeof search.tab === 'string' && search.tab) out.tab = search.tab
  if (typeof search.collection === 'string' && search.collection) out.collection = search.collection
  if (typeof search.network === 'string' && search.network) out.network = search.network
  const min = numberOrUndefined(search.min)
  if (min != null && min > 0) out.min = min
  const max = numberOrUndefined(search.max)
  if (max != null) out.max = max
  const page = numberOrUndefined(search.page)
  if (page != null && page > 1) out.page = Math.floor(page)
  return out
}

function toState(search: CatalogSearch): CatalogState {
  return {
    search: search.q ?? '',
    sort: search.sort ?? 'newest',
    tab: search.tab ?? 'todos',
    collection: search.collection,
    network: search.network,
    minPrice: search.min,
    maxPrice: search.max,
    page: search.page ?? 1
  }
}

function toSearch(state: CatalogState): CatalogSearch {
  const out: CatalogSearch = {}
  if (state.search) out.q = state.search
  if (state.sort !== 'newest') out.sort = state.sort
  if (state.tab !== 'todos') out.tab = state.tab
  if (state.collection) out.collection = state.collection
  if (state.network) out.network = state.network
  if (state.minPrice != null && state.minPrice > 0) out.min = state.minPrice
  if (state.maxPrice != null) out.max = state.maxPrice
  if (state.page > 1) out.page = state.page
  return out
}

export const Route = createFileRoute('/')({
  validateSearch,
  component: HomeRoute
})

function HomeRoute() {
  const state = toState(Route.useSearch())
  const navigate = useNavigate({ from: '/' })
  const { openAuth } = useAuthDialog()

  const patch = (partial: Partial<CatalogState>) =>
    navigate({ search: (prev) => toSearch({ ...toState(prev), ...partial }), resetScroll: false })

  const requireAuth = () => openAuth('login')

  return (
    <main className="flex flex-col gap-4 pt-8 pb-8 sm:gap-24">
      <MobileCatalogBar search={state.search} values={state} onChange={patch} />
      <HomeHero />
      <CatalogScreen
        state={state}
        onPatch={patch}
        onRequireAuth={requireAuth}
        showMobileFilterTrigger={false}
      />
      <HomePromos />
      <HomeBlog />
    </main>
  )
}
