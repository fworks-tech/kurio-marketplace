import { SlidersHorizontalIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet'


import { cn } from '@/lib/utils'
import type { CatalogFacets, CatalogFilterValues } from '../catalog-types'
import { FilterPanel } from './filter-panel'
import { FeaturedNftBanner } from './featured-nft-banner'

interface FilterSidebarProps {
  facets: CatalogFacets
  values: CatalogFilterValues
  bounds: { min: number; max: number }
  onChange: (patch: Partial<CatalogFilterValues>) => void
  className?: string
  /** Home renders the Figma search + filter row above the hero, so it hides this trigger. */
  showMobileTrigger?: boolean
}

/** Desktop sticky sidebar (filters card + featured banner) and a mobile drawer sharing one FilterPanel body. */
export function FilterSidebar({
  facets,
  values,
  bounds,
  onChange,
  className,
  showMobileTrigger = true
}: FilterSidebarProps) {
  const panel = <FilterPanel facets={facets} values={values} bounds={bounds} onChange={onChange} />

  return (
    <>
      <aside className={cn('sticky top-24 hidden w-[310px] shrink-0 flex-col gap-6 lg:flex', className)}>
        <div className="bg-surface-card rounded-card p-5">{panel}</div>
        <FeaturedNftBanner />
      </aside>

      {showMobileTrigger ? (
        <div className={cn('lg:hidden', className)}>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full">
                <SlidersHorizontalIcon data-icon="inline-start" />
                Filtros
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[85vw] max-w-sm gap-0 p-0 sm:max-w-sm">
              <SheetHeader className="border-border border-b px-6 py-4">
                <SheetTitle>Filtros</SheetTitle>
              </SheetHeader>
              <div className="overflow-y-auto p-6">{panel}</div>
            </SheetContent>
          </Sheet>
        </div>
      ) : null}
    </>
  )
}
