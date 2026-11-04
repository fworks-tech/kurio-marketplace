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
}

export function OrderSummary({
  subtotalEth,
  discountEth,
  discountLabel = 'Desconto de lançamento',
  networkFeeEth,
  totalEth,
  loading,
  updating,
  className
}: OrderSummaryProps) {
  if (loading) {
    return <SummarySkeleton className={className} />
  }

  return (
    <div
      className={cn('space-y-3', className)}
      aria-busy={Boolean(updating)}
    >
      {updating ? (
        <p role="status" className="text-text-secondary text-xs">
          Atualizando valores…
        </p>
      ) : null}
      <TotalRow label="Subtotal" value={formatPrice(subtotalEth)} />
      {discountEth ? (
        <TotalRow label={discountLabel}>
          <span className="text-success text-sm tabular-nums">-{formatPrice(discountEth)}</span>
        </TotalRow>
      ) : null}
      <TotalRow label="Taxa de rede" value={formatPrice(networkFeeEth)} />
      <p className="text-text-secondary text-xs">Taxa estimada da rede e pode variar na confirmação.</p>
      <TotalRow label="Total" value={formatPrice(totalEth)} strong className="border-white/10 border-t pt-3" />
    </div>
  )
}
