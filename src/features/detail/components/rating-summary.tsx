import { StarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RatingSummaryProps {
  value: number
  count: number
  variant?: 'mobile' | 'desktop'
  className?: string
}

export function RatingSummary({ value, count, variant = 'desktop', className }: RatingSummaryProps) {
  return (
    <p className={cn('text-text-secondary flex items-center gap-1 text-sm', className)}>
      <StarIcon aria-hidden className="fill-highlight text-highlight size-4" />
      {variant === 'mobile' ? (
        <span>
          {value.toFixed(1)}({count})
        </span>
      ) : (
        <span>
          <span className="text-text font-semibold">{value.toFixed(1)}</span> ·{' '}
          {count} {count === 1 ? 'avaliação de colecionador' : 'avaliações de colecionadores'}
        </span>
      )}
    </p>
  )
}
