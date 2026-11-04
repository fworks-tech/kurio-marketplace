import { useEffect, useRef, useState } from 'react'
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

  // Dragging the thumbs must survive a facets refetch; only an external clear
  // (or the very first bounds arriving) may reset the position.
  const touched = useRef(false)
  const onRangeChange = (next: { min: number; max: number }) => {
    touched.current = true
    setRange(next)
  }

  /** The frame only has the slider, the "Preço:" readout and the Aplicar button. */
  const applyPrice = () => onChange({ minPrice: range.min, maxPrice: range.max })

  // Bounds arrive with the facets request. The slider only follows the outside
  // world when those inputs actually change: a refetch with the same numbers must
  // not snap the thumbs back to the defaults mid-drag.
  const lastApplied = useRef('')
  useEffect(() => {
    const applied = `${values.minPrice ?? ''}|${values.maxPrice ?? ''}`
    // An applied (or cleared) price filter is an outside instruction: follow it.
    if (applied !== lastApplied.current) {
      lastApplied.current = applied
      touched.current = false
      setRange({ min: values.minPrice ?? bounds.min, max: values.maxPrice ?? bounds.max })
      return
    }
    // Facets arriving later only seed the slider while it is untouched.
    if (!touched.current) {
      setRange({ min: values.minPrice ?? bounds.min, max: values.maxPrice ?? bounds.max })
    }
  }, [bounds.min, bounds.max, values.minPrice, values.maxPrice])

  return (
    <div className="flex flex-col gap-10">
      {facets.collections.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className={SECTION_TITLE}>Coleções</h2>
          <FacetList
            items={[...facets.collections].sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))}
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
            onChange={onRangeChange}
            hideLabel
          />
          <div className="flex flex-col items-start gap-3">
            <span className="text-canvas text-[15px] leading-[19.8px]">
              Preço: {formatPriceRange(fromMicro(range.min), fromMicro(range.max))}
            </span>
            <button
              type="button"
              onClick={applyPrice}
              className="bg-primary text-ink h-9 w-[92px] rounded-md text-base leading-5 font-bold"
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
