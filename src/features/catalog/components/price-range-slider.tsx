import { cn } from '@/lib/utils'
import { fromMicro } from '@/shared/api/money'
import { formatPriceRange } from '@/shared/lib/format'

export interface PriceRangeValue {
  min: number
  max: number
}

interface PriceRangeSliderProps {
  min: number
  max: number
  value: PriceRangeValue
  onChange: (value: PriceRangeValue) => void
  className?: string
  hideLabel?: boolean
}

const INPUT_CLASS =
  'pointer-events-none absolute inset-0 h-1.5 w-full appearance-none bg-transparent ' +
  '[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-primary ' +
  '[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-primary'

/** Two native range inputs share one track so both thumbs are keyboard operable. */
export function PriceRangeSlider({ min, max, value, onChange, className, hideLabel }: PriceRangeSliderProps) {
  const span = max > min ? max - min : 1
  const pctLeft = ((value.min - min) / span) * 100
  const pctRight = 100 - ((value.max - min) / span) * 100

  return (
    <div className={cn('space-y-3', className)}>
      {!hideLabel ? (
        <span className="text-text-secondary block text-sm tabular-nums">
          {formatPriceRange(fromMicro(value.min), fromMicro(value.max))}
        </span>
      ) : null}
      <div className="relative h-1.5">
        <div className="bg-white/15 absolute inset-0 rounded-full" />
        <div
          className="bg-primary absolute inset-y-0 rounded-full"
          style={{ left: `${pctLeft}%`, right: `${pctRight}%` }}
        />
        <input
          type="range"
          aria-label="Preço mínimo"
          min={min}
          max={max}
          value={value.min}
          onChange={(event) => {
            const next = Math.min(Number(event.target.value), value.max)
            onChange({ ...value, min: next })
          }}
          className={INPUT_CLASS}
        />
        <input
          type="range"
          aria-label="Preço máximo"
          min={min}
          max={max}
          value={value.max}
          onChange={(event) => {
            const next = Math.max(Number(event.target.value), value.min)
            onChange({ ...value, max: next })
          }}
          className={INPUT_CLASS}
        />
      </div>
    </div>
  )
}
