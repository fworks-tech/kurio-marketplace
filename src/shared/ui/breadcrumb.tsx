import { Link } from '@tanstack/react-router'
import type { LinkProps } from '@tanstack/react-router'
import { ChevronRightIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type RouteTo = LinkProps['to']

export interface BreadcrumbItem {
  label: string
  to?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Trilha de navegação"
      className={cn('text-text-secondary flex items-center text-sm', className)}
    >
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              {item.to && !isLast ? (
                <Link to={item.to as unknown as RouteTo} className="hover:text-text">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isLast ? 'page' : undefined}>{item.label}</span>
              )}
              {!isLast ? <ChevronRightIcon aria-hidden className="size-4" /> : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
