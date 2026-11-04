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
  priceEth: string
  lineTotalEth: string
  quantity: number
  max: number
  onQuantityChange: (quantity: number) => void
  onRemove: () => void
  className?: string
}

/**
 * Figma `Cart Item`: 70px row on #241612, a 70px artwork, title and token id in a
 * 250px column, then price, the square stepper, the line total and the delete icon.
 * Below `md` it collapses to a stacked card.
 */
export function CartItemRow({
  image,
  title,
  tokenId,
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
        'bg-surface-card flex flex-col gap-3 rounded-none px-4 py-3 md:grid md:h-[70px] md:grid-cols-[250px_77px_75px_87px_24px] md:items-center md:justify-between md:gap-0 md:py-0 md:pr-6 md:pl-0',
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-4">
        <img src={image} alt="" className="size-[70px] shrink-0 rounded-[6px] object-cover" />
        <div className="min-w-0">
          <p className="text-canvas truncate text-base leading-4 font-bold">{title}</p>
          <p className="text-sand mt-1.5 text-sm leading-4">ID do token: {formatTokenId(tokenId)}</p>
        </div>
      </div>

      <div className="hidden md:block">
        <PriceDisplay value={priceEth} className="text-text-secondary text-base leading-4 font-bold" />
      </div>

      <QuantityStepper
        value={quantity}
        max={max}
        onChange={onQuantityChange}
        label="Qtd."
        variant="compact"
      />

      <div className="flex items-center justify-between gap-3 md:contents">
        <PriceDisplay value={lineTotalEth} className="text-highlight text-base leading-4 font-bold" />
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Remover ${title}`}
          onClick={onRemove}
          className="text-canvas hover:text-highlight size-12 p-0 md:size-6"
        >
          <Trash2Icon className="size-4 md:size-6" />
        </Button>
      </div>
    </div>
  )
}
