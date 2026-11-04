import { cn } from '@/lib/utils'
import { formatPrice } from '@/shared/lib/format'

interface PriceDisplayProps {
  value: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/** Read-only ETH price in the dot-decimal card format (never the comma filter format). */
export function PriceDisplay({ value, size = 'md', className }: PriceDisplayProps) {
  return (
    <span
      className={cn(
        'font-bold tabular-nums',
        size === 'lg' && 'text-xl',
        size === 'sm' && 'text-xs',
        className
      )}
    >
      {formatPrice(value)}
    </span>
  )
}
