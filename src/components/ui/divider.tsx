import * as React from 'react'
import { cn } from '@/lib/utils'

/* Divider with an optional centered label — the "Ou continue com" pattern.
 * When labelled it is decorative (a section break), so it is hidden from the
 * accessibility tree and the label text carries the meaning. */

function Divider({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) {
  if (!children) {
    return (
      <div
        role="separator"
        aria-orientation="horizontal"
        className={cn('bg-border h-px w-full', className)}
        {...props}
      />
    )
  }

  return (
    <div
      aria-hidden
      className={cn('flex items-center gap-4 text-caption text-muted-foreground', className)}
      {...props}
    >
      <span className="bg-border h-px flex-1" />
      <span className="whitespace-nowrap">{children}</span>
      <span className="bg-border h-px flex-1" />
    </div>
  )
}

export { Divider }
