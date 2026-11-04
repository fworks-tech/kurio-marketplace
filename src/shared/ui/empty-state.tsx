import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  icon?: ReactNode
  className?: string
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  className
}: EmptyStateProps) {
  return (
    <div
      className={
        className
          ? `flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/15 p-10 text-center ${className}`
          : 'flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/15 p-10 text-center'
      }
    >
      {icon ? <div aria-hidden className="text-text-secondary">{icon}</div> : null}
      <p className="font-semibold">{title}</p>
      {description ? <p className="text-sm text-text-secondary">{description}</p> : null}
      {onAction ? (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionLabel ?? 'Ação'}
        </Button>
      ) : null}
    </div>
  )
}
