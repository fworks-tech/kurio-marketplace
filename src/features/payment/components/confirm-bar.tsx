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
        'bg-ink/95 fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-4 px-6 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur lg:static lg:border-t lg:border-border lg:px-4 lg:py-3',
        className
      )}
    >
      <div className="hidden lg:block">
        <p className="text-text-secondary text-xs">Total</p>
        <p className="text-lg font-bold tabular-nums">{formatPrice(totalEth)}</p>
      </div>
      <Button
        onClick={onConfirm}
        disabled={disabled || loading}
        className="h-[60px] w-full rounded-[40px] text-[16px] font-bold lg:h-10 lg:w-auto lg:rounded-[8px] lg:text-sm"
      >
        {loading ? 'Confirmando…' : actionLabel}
      </Button>
    </div>
  )
}
