import { cn } from '@/lib/utils'
import { formatPrice } from '@/shared/lib/format'
import { Button } from '@/components/ui/button'

interface ConfirmBarProps {
  totalEth: string
  actionLabel: string
  onConfirm: () => void
  disabled?: boolean
  loading?: boolean
  className?: string
}

/** Sticky confirm bar, safe-area aware on mobile. */
export function ConfirmBar({
  totalEth,
  actionLabel,
  onConfirm,
  disabled,
  loading,
  className
}: ConfirmBarProps) {
  return (
    <div
      className={cn(
        'border-border bg-ink/95 flex items-center justify-between gap-4 border-t px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:static',
        className
      )}
    >
      <div>
        <p className="text-text-secondary text-xs">Total</p>
        <p className="text-lg font-bold tabular-nums">{formatPrice(totalEth)}</p>
      </div>
      <Button size="lg" onClick={onConfirm} disabled={disabled || loading}>
        {loading ? 'Confirmando…' : actionLabel}
      </Button>
    </div>
  )
}
