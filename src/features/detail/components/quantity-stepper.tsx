import { MinusIcon, PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { quantityLimits, stepQuantity } from '@/shared/lib/quantity'

interface QuantityStepperProps {
  value: number
  min?: number
  max: number
  onChange: (value: number) => void
  label?: string
  /** `compact` is the 20x30 square button pair used inside the cart table. */
  variant?: 'default' | 'compact'
  className?: string
}

/** Integer stepper that disables the boundary buttons and announces the limit reached. */
export function QuantityStepper({
  value,
  min = 1,
  max,
  onChange,
  label = 'Quantidade',
  variant = 'default',
  className
}: QuantityStepperProps) {
  const { atMin, atMax } = quantityLimits(value, min, max)

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <Button
          variant="ghost"
          aria-label={`Diminuir ${label.toLowerCase()}`}
          disabled={atMin}
          onClick={() => onChange(stepQuantity(value, -1, min, max))}
          className="bg-primary text-ink border-ink hover:bg-highlight h-11 w-11 shrink-0 rounded-[20px] border p-0 md:h-[30px] md:w-5"
        >
          <MinusIcon className="size-4 md:size-[9px]" />
        </Button>
        <input
          type="text"
          inputMode="numeric"
          role="spinbutton"
          aria-label={label}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          value={value}
          onChange={(event) =>
            onChange(stepQuantity(Number.parseInt(event.target.value, 10) || min, 0, min, max))
          }
          className="text-canvas w-8 shrink-0 bg-transparent text-center text-[17px] leading-6 tabular-nums outline-none md:w-[34px]"
        />
        <Button
          variant="ghost"
          aria-label={`Aumentar ${label.toLowerCase()}`}
          disabled={atMax}
          onClick={() => onChange(stepQuantity(value, 1, min, max))}
          className="bg-primary text-ink border-ink hover:bg-highlight h-11 w-11 shrink-0 rounded-[20px] border p-0 md:h-[30px] md:w-5"
        >
          <PlusIcon className="size-4 md:size-[9px]" />
        </Button>
        <span role="status" className="sr-only">
          {atMax ? 'Limite máximo atingido.' : atMin ? 'Quantidade mínima.' : ''}
        </span>
      </div>
    )
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="text-sm font-medium">{label}</span>
      <div className="border-white/15 inline-flex items-center rounded-pill border">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Diminuir quantidade"
          disabled={atMin}
          onClick={() => onChange(stepQuantity(value, -1, min, max))}
        >
          <MinusIcon className="size-4" />
        </Button>
        <input
          type="text"
          inputMode="numeric"
          role="spinbutton"
          aria-label={label}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          value={value}
          onChange={(event) => onChange(stepQuantity(Number.parseInt(event.target.value, 10) || min, 0, min, max))}
          className="w-10 bg-transparent text-center text-sm tabular-nums outline-none"
        />
        <Button
          variant="ghost"
          size="icon"
          aria-label="Aumentar quantidade"
          disabled={atMax}
          onClick={() => onChange(stepQuantity(value, 1, min, max))}
        >
          <PlusIcon className="size-4" />
        </Button>
      </div>
      <span role="status" className="sr-only">
        {atMax ? 'Limite máximo atingido.' : atMin ? 'Quantidade mínima.' : ''}
      </span>
    </div>
  )
}
