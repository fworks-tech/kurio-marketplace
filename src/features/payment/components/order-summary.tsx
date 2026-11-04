import { cn } from '@/lib/utils'
import { formatPrice } from '@/shared/lib/format'
import { SummarySkeleton } from '@/shared/ui/skeletons'
import { TotalRow } from './total-row'

interface OrderSummaryProps {
  subtotalEth: string
  discountEth?: string
  discountLabel?: string
  networkFeeEth: string
  totalEth: string
  loading?: boolean
  updating?: boolean
  className?: string
  /** Fee note alignment: right in the cart frame, centered in the payment frame. */
  noteAlign?: 'left' | 'center' | 'right'
  /** Payment frame insets the total row by 42px; the cart frame keeps it flush. */
  insetTotal?: boolean
}

/**
 * Figma `Fees`: label 15/19.78 cream, values 18/16 cream, the "Taxa estimada" note in
 * 12px orange under the fee, and the total in 18/16 bold orange without a separator.
 */
export function OrderSummary({
  subtotalEth,
  discountEth,
  discountLabel = 'Desconto do lançamento',
  networkFeeEth,
  totalEth,
  loading,
  updating,
  className,
  noteAlign = 'right',
  insetTotal = false
}: OrderSummaryProps) {
  if (loading) {
    return <SummarySkeleton className={className} />
  }

  return (
    <div className={cn('space-y-3', className)} aria-busy={Boolean(updating)}>
      {updating ? (
        <p role="status" className="text-highlight text-xs">
          Atualizando valores…
        </p>
      ) : null}

      <div className="flex items-baseline justify-between gap-4">
        <span className="text-canvas text-[15px] leading-[19.8px]">Subtotal</span>
        <span className="text-canvas text-lg leading-4 tabular-nums">{formatPrice(subtotalEth)}</span>
      </div>

      {discountEth !== undefined ? (
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-canvas text-[15px] leading-[19.8px]">{discountLabel}</span>
          <span className="text-canvas text-[15px] leading-[19.8px] tabular-nums">
            (-) {formatPrice(discountEth)}
          </span>
        </div>
      ) : null}

      <div className="space-y-3">
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-canvas text-[15px] leading-[19.8px]">Taxa de rede</span>
          <span className="text-canvas text-lg leading-4 tabular-nums">{formatPrice(networkFeeEth)}</span>
        </div>
        <p
          className={cn(
            'text-highlight text-xs leading-4',
            noteAlign === 'center' && 'text-center',
            noteAlign === 'right' && 'text-right'
          )}
        >
          Taxa estimada
        </p>
      </div>

      <TotalRow
        label="Total"
        value={formatPrice(totalEth)}
        className={cn(
          'pt-3 [&>span]:text-canvas [&>span]:text-base [&>span]:leading-4 [&>span]:font-bold [&>span:last-child]:text-highlight [&>span:last-child]:text-lg [&>span:last-child]:tabular-nums',
          insetTotal && 'px-[42px]'
        )}
      />
    </div>
  )
}
