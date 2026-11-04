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
        'bg-surface-card relative flex h-[100px] items-center gap-2 overflow-hidden rounded-[14px] pr-2 md:grid md:h-[70px] md:grid-cols-[250px_77px_75px_87px_24px] md:items-center md:justify-between md:gap-0 md:rounded-none md:py-0 md:pr-6 md:pl-0',
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-2 md:gap-4">
        <img
          src={image}
          alt=""
          className="size-[100px] shrink-0 rounded-[14px] object-cover md:size-[70px] md:rounded-[6px]"
        />
        <div className="min-w-0">
          <p className="text-canvas truncate text-[15px] leading-4 font-bold md:text-base">{title}</p>
          <p className="text-sand mt-1.5 truncate text-sm leading-4">
            Edição: 1/50
            <span className="sr-only"> · ID do token: {formatTokenId(tokenId)}</span>
          </p>
          <div className="mt-4 md:hidden">
            <PriceDisplay value={priceEth} className="text-price text-lg leading-4 font-bold" />
          </div>
        </div>
      </div>

      <div className="hidden md:block">
        <PriceDisplay value={priceEth} className="text-text-secondary text-base leading-4 font-bold" />
      </div>

      <div className="md:contents">
      <QuantityStepper
        value={quantity}
        max={max}
        onChange={onQuantityChange}
        label="Qtd."
        variant="compact"
      />
      </div>

      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remover ${title}`}
        className="text-sand hover:text-highlight absolute top-2 right-2 grid size-7 place-items-center md:hidden"
      >
        <Trash2Icon aria-hidden className="size-4" />
      </button>

      <div className="hidden items-center justify-between gap-3 md:contents md:flex">
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
