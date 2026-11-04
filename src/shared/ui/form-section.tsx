import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface FormSectionProps {
  title: string
  description?: string
  children: ReactNode
  className?: string
}

export function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <fieldset className={cn('space-y-4 border-0 p-0', className)}>
      <legend className="text-base font-bold">{title}</legend>
      {description ? (
        <p className="text-text-secondary -mt-2 text-sm">{description}</p>
      ) : null}
      <div className="space-y-4">{children}</div>
    </fieldset>
  )
}
