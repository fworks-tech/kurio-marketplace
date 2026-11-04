import { Trash2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PriceDisplay } from '@/shared/ui/price-display'
import { formatTokenId } from '@/shared/lib/format'
import { QuantityStepper } from '@/features/detail/components/quantity-stepper'

interface CartItemRowProps {
  image: string
  title: string
  tokenId: string
  edition: string
  priceEth: string
  lineTotalEth: string
  quantity: number
  max: number
  onQuantityChange: (quantity: number) => void
  onRemove: () => void
  className?: string
}

/** Desktop table-style row that collapses to a stacked card under md. */
export function CartItemRow({
  image,
  title,
  tokenId,
  edition,
  priceEth,
  lineTotalEth,
  quantity,
  max,
  onQuantityChange,
  onRemove,
  className
}: CartItemRowProps) {
  return (
    <div
      className={cn(
        'bg-surface-card flex flex-col gap-3 rounded-[6px] px-4 py-3 md:grid md:min-h-[70px] md:grid-cols-[minmax(0,1fr)_auto_auto_auto_auto] md:items-center md:gap-4 md:py-0 md:pr-6',
        className
      )}
    >
      <img
        src={image}
        alt=""
        className="size-[70px] shrink-0 rounded-[6px] object-cover"
      />

      <div className="min-w-0 md:pl-4">
        <p className="text-canvas truncate text-base leading-4 font-bold">{title}</p>
        <p className="text-sandish mt-1.5 text-sm leading-4">
          ID do token: {formatTokenId(tokenId)}
        </p>
        <p className="text-text-secondary text-xs leading-4">Edição {edition}</p>
      </div>

      <div className="hidden md:block">
        <PriceDisplay value={priceEth} className="text-sandish text-base leading-4 font-bold" />
      </div>

      <QuantityStepper value={quantity} max={max} onChange={onQuantityChange} label="Qtd." />

      <div className="flex items-center justify-between gap-3 md:flex-col md:items-end">
        <PriceDisplay value={lineTotalEth} className="md:text-right" />
        <Button variant="ghost" size="sm" aria-label={`Remover ${title}`} onClick={onRemove}>
          <Trash2Icon className="size-4" />
        </Button>
      </div>
    </div>
  )
}
