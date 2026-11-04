import { useEffect, useState } from 'react'
import { fromMicro } from '@/shared/api/money'
import { formatPriceRange } from '@/shared/lib/format'
import { cn } from '@/lib/utils'
import type { CatalogFacetOption, CatalogFacets, CatalogFilterValues } from '../catalog-types'
import { PriceRangeSlider } from './price-range-slider'

const SECTION_TITLE = 'text-canvas text-lg leading-4 font-bold'

function FacetList({
  items,
  selected,
  onSelect,
  countClass
}: {
  items: CatalogFacetOption[]
  selected?: string
  onSelect: (value?: string) => void
  countClass: string
}) {
  return (
    <ul className="flex flex-col px-3">
      {items.map((item) => {
        const active = selected === item.value
        return (
          <li key={item.value}>
            <button
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(active ? undefined : item.value)}
              className="flex h-10 w-full items-center justify-between gap-2.5 text-left text-[15px] leading-10"
            >
              <span className={active ? 'text-highlight' : 'text-text-secondary'}>{item.label}</span>
              <span className={cn(active ? 'text-highlight font-bold' : countClass)}>({item.count})</span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

interface FilterPanelProps {
  facets: CatalogFacets
  values: CatalogFilterValues
  bounds: { min: number; max: number }
  onChange: (patch: Partial<CatalogFilterValues>) => void
  onClear?: () => void
  resultsLabel?: string
}

export function FilterPanel({ facets, values, bounds, onChange }: FilterPanelProps) {
  const [range, setRange] = useState({
    min: values.minPrice ?? bounds.min,
    max: values.maxPrice ?? bounds.max
  })

  // Bounds arrive with the facets request; without this the slider keeps the loading fallback.
  useEffect(() => {
    setRange({ min: values.minPrice ?? bounds.min, max: values.maxPrice ?? bounds.max })
  }, [bounds.min, bounds.max, values.minPrice, values.maxPrice])

  return (
    <div className="flex flex-col gap-10">
      {facets.collections.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className={SECTION_TITLE}>Coleções</h2>
          <FacetList
            items={facets.collections}
            selected={values.collection}
            onSelect={(collection) => onChange({ collection })}
            countClass="text-text-secondary font-bold"
          />
        </section>
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className={SECTION_TITLE}>Faixa de preço</h2>
        <div className="flex flex-col gap-3 pl-3">
          <PriceRangeSlider
            min={bounds.min}
            max={bounds.max}
            value={range}
            onChange={setRange}
            hideLabel
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-canvas text-[15px] leading-5">
              Preço: {formatPriceRange(fromMicro(range.min), fromMicro(range.max))}
            </span>
            <button
              type="button"
              onClick={() => onChange({ minPrice: range.min, maxPrice: range.max })}
              className="bg-primary text-ink h-9 shrink-0 rounded-md px-3 text-base font-bold"
            >
              Aplicar
            </button>
          </div>
        </div>
      </section>

      {facets.networks.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className={SECTION_TITLE}>Rede</h2>
          <FacetList
            items={facets.networks}
            selected={values.network}
            onSelect={(network) => onChange({ network })}
            countClass="text-text-secondary"
          />
        </section>
      ) : null}
    </div>
  )
}
