import { ChevronRightIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buildPageWindow } from '@/shared/lib/pagination'

interface CatalogPaginationProps {
  page: number
  totalPages: number
  onChange: (page: number) => void
  className?: string
}

/**
 * Figma `Pagination` (home): right-aligned strip inside the product column, ending
 * at the frame's right edge — 35x35 cells, 8px apart, the active page filled with
 * `#D28A4C` and `#140D0A` bold text, the rest outlined with `#3F2319`, then an
 * 18px next arrow. Four numeric cells stay visible and follow the current page.
 */
const CELL = 'grid size-[35px] shrink-0 place-items-center rounded-[4px] text-lg leading-4'

export function CatalogPagination({ page, totalPages, onChange, className }: CatalogPaginationProps) {
  if (totalPages <= 1) return null

  return (
    <nav aria-label="Paginação" className={cn('flex items-center justify-end gap-2', className)}>
      {buildPageWindow(page, totalPages).map((value) => (
        <button
          key={value}
          type="button"
          aria-current={value === page ? 'page' : undefined}
          aria-label={`Página ${value}`}
          onClick={() => onChange(value)}
          className={cn(
            CELL,
            value === page
              ? 'bg-primary text-ink font-bold'
              : 'border-field text-canvas border font-normal'
          )}
        >
          {value}
        </button>
      ))}
      {page < totalPages ? (
        <button
          type="button"
          aria-label="Próxima página"
          onClick={() => onChange(page + 1)}
          className={cn(CELL, 'border-field text-canvas border')}
        >
          <ChevronRightIcon aria-hidden className="size-[18px]" />
        </button>
      ) : null}
    </nav>
  )
}
