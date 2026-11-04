import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface AccountLayoutProps {
  sidebar: ReactNode
  children: ReactNode
  className?: string
}

/**
 * Body of the account screens (Figma `Body`): 1200px content, 310px rail and a
 * flexible form column with a 28px gutter.
 */
export function AccountLayout({ sidebar, children, className }: AccountLayoutProps) {
  return (
    <main
      className={cn(
        'mx-auto w-full max-w-[1200px] px-6 pt-6 pb-12 lg:px-0',
        className
      )}
    >
      <div className="flex flex-col gap-7 lg:flex-row">
        {sidebar}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </main>
  )
}
