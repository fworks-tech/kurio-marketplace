import { SlidersHorizontalIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet'
import { deriveBounds, deriveFacets, useCatalogFacets } from '../catalog-queries'
import type { CatalogFilterValues } from '../catalog-types'
import { FilterPanel } from './filter-panel'
import { SearchField } from './search-field'

interface MobileCatalogBarProps {
  search: string
  values: CatalogFilterValues
  onChange: (patch: Partial<CatalogFilterValues>) => void
}

/**
 * Figma `Mobile / Início` search row: a 313x45 rounded field beside a 45x45
 * filter button, sitting above the hero. The drawer reuses the desktop panel.
 */
export function MobileCatalogBar({ search, values, onChange }: MobileCatalogBarProps) {
  const facetQuery = useCatalogFacets()
  const facets = deriveFacets(facetQuery.data)
  const bounds = deriveBounds(facetQuery.data)

  return (
    <div className="mx-auto w-full max-w-[1248px] px-6 pt-6 lg:hidden">
      <Sheet>
        <div className="flex items-center gap-2">
          <SearchField
            id="catalog-search-mobile"
            value={search}
            onChange={(next) => onChange({ search: next })}
            label="Buscar NFT"
            placeholder="Explorar coleções"
            className="min-w-0 flex-1 [&_input]:h-[45px] [&_input]:rounded-[10px] [&_input]:border-transparent [&_input]:bg-surface-card"
          />
          <SheetTrigger asChild>
            <Button
              variant="outline"
              aria-label="Filtros"
              className="bg-surface-card size-[45px] shrink-0 rounded-[14px] border-transparent p-0"
            >
              <SlidersHorizontalIcon aria-hidden className="size-[22px]" />
            </Button>
          </SheetTrigger>
        </div>
        <SheetContent side="left" className="w-[85vw] max-w-sm gap-0 p-0 sm:max-w-sm">
          <SheetHeader className="border-border border-b px-6 py-4">
            <SheetTitle>Filtros</SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto p-6">
            <FilterPanel facets={facets} values={values} bounds={bounds} onChange={onChange} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
