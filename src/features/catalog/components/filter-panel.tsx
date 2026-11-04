import { useEffect, useId, useRef, useState } from 'react'
import { fromMicro, toMicro } from '@/shared/api/money'
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
  const priceId = useId()
  const [range, setRange] = useState({
    min: values.minPrice ?? bounds.min,
    max: values.maxPrice ?? bounds.max
  })
  // Free-text copies of the bounds: the designer's note (comment #5) asks for two
  // typed fields because a slider is imprecise, especially on touch screens.
  const [minDraft, setMinDraft] = useState(() => fromMicro(values.minPrice ?? bounds.min))
  const [maxDraft, setMaxDraft] = useState(() => fromMicro(values.maxPrice ?? bounds.max))

  // Bounds arrive after the first paint: once the collector starts typing, the
  // incoming defaults must not overwrite what was already written.
  const typedPrice = useRef(false)

  useEffect(() => {
    if (typedPrice.current) return
    setMinDraft(fromMicro(range.min))
    setMaxDraft(fromMicro(range.max))
  }, [range.min, range.max])

  /** Reads both typed fields, clamps them to the catalog bounds and orders them. */
  const draftRange = () => {
    const parse = (raw: string, fallback: number) => {
      const value = Number.parseFloat(raw.replace(',', '.'))
      if (!Number.isFinite(value) || value < 0) return fallback
      return Math.min(bounds.max, Math.max(bounds.min, toMicro(String(value))))
    }
    const min = parse(minDraft, range.min)
    const max = parse(maxDraft, range.max)
    return min <= max ? { min, max } : { min: max, max: min }
  }

  /** Writes the normalized values back, so an inverted range shows both fields swapped. */
  const syncDrafts = (next: { min: number; max: number }) => {
    setMinDraft(fromMicro(next.min))
    setMaxDraft(fromMicro(next.max))
  }

  const commitDrafts = () => {
    const next = draftRange()
    setRange(next)
    syncDrafts(next)
  }

  // The button reads the drafts directly: clicking it also blurs the field, and the
  // blur commit lands after this handler, so relying on `range` would apply the old one.
  const applyPrice = () => {
    const next = draftRange()
    setRange(next)
    syncDrafts(next)
    onChange({ minPrice: next.min, maxPrice: next.max })
  }

  const onDraftKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      commitDrafts()
    }
  }

  const priceInputClass =
    'border-field text-canvas placeholder:text-sand h-9 w-[92px] rounded-[3px] border bg-transparent px-2 text-sm tabular-nums focus-visible:ring-highlight focus-visible:ring-2 focus-visible:outline-none'

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
            onChange={setRange}
            hideLabel
          />
          <div className="flex items-center gap-3">
            <label htmlFor={`${priceId}-min`} className="sr-only">
              Preço mínimo
            </label>
            <input
              id={`${priceId}-min`}
              inputMode="decimal"
              value={minDraft}
              placeholder="mín."
              aria-label="Preço mínimo"
              onChange={(event) => {
                typedPrice.current = true
                setMinDraft(event.target.value)
              }}
              onBlur={commitDrafts}
              onKeyDown={onDraftKeyDown}
              className={priceInputClass}
            />
            <span aria-hidden className="text-text-secondary text-sm">
              —
            </span>
            <label htmlFor={`${priceId}-max`} className="sr-only">
              Preço máximo
            </label>
            <input
              id={`${priceId}-max`}
              inputMode="decimal"
              value={maxDraft}
              placeholder="máx."
              aria-label="Preço máximo"
              onChange={(event) => {
                typedPrice.current = true
                setMaxDraft(event.target.value)
              }}
              onBlur={commitDrafts}
              onKeyDown={onDraftKeyDown}
              className={priceInputClass}
            />
          </div>
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
