import { StarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Review {
  id: string
  author: string
  rating: number
  date?: string
  text: string
}

interface ReviewListProps {
  reviews: Review[]
  emptyLabel?: string
  className?: string
}

export function ReviewList({ reviews, emptyLabel = 'Ainda não há avaliações.', className }: ReviewListProps) {
  if (reviews.length === 0) {
    return <p className={cn('text-text-secondary text-sm', className)}>{emptyLabel}</p>
  }

  return (
    <ul className={cn('divide-white/10 space-y-0 divide-y', className)}>
      {reviews.map((review) => (
        <li key={review.id} className="py-4">
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="text-sm font-semibold">{review.author}</span>
            <span className="text-text-secondary flex items-center gap-0.5 text-xs">
              <StarIcon aria-hidden className="fill-highlight text-highlight size-3" />
              {review.rating.toFixed(1)}
            </span>
          </div>
          {review.date ? (
            <p className="text-text-secondary text-xs">{review.date}</p>
          ) : null}
          <p className="mt-1 text-sm">{review.text}</p>
        </li>
      ))}
    </ul>
  )
}
