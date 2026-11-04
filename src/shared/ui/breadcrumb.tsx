import { Link } from '@tanstack/react-router'
import type { LinkProps } from '@tanstack/react-router'
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

/**
 * Figma `Frame 357`: one 15/16 bold cream line, segments separated by a slash —
 * no chevrons, and the current page keeps the same weight as the trail.
 */
export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Trilha de navegação"
      className={cn('text-canvas text-[15px] leading-4 font-bold', className)}
    >
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              {item.to && !isLast ? (
                <Link to={item.to as unknown as RouteTo} className="hover:text-highlight">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isLast ? 'page' : undefined}>{item.label}</span>
              )}
              {!isLast ? <span aria-hidden>/</span> : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
