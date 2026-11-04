import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface TotalRowProps {
  label: string
  value?: string
  children?: ReactNode
  strong?: boolean
  className?: string
}

export function TotalRow({ label, value, children, strong, className }: TotalRowProps) {
  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      <span className={cn('text-text-secondary text-sm', strong && 'text-text font-bold')}>
        {label}
      </span>
      {children ?? <span className={cn('text-sm tabular-nums', strong && 'text-lg font-bold')}>{value}</span>}
    </div>
  )
}
