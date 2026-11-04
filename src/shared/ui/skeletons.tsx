import { cn } from '@/lib/utils'
import { Skeleton } from './skeleton'

/** Cart / wallet line placeholder matching the loaded row height. */
export function RowSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3 py-3', className)}>
      <Skeleton className="size-16 shrink-0 rounded-md" label="Carregando imagem" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-1/2" label="Carregando nome" />
        <Skeleton className="h-3 w-1/4" label="Carregando detalhes" />
      </div>
      <Skeleton className="h-4 w-16 shrink-0" label="Carregando valor" />
    </div>
  )
}

/** Order summary placeholder: label/value rows plus a heavier total. */
export function SummarySkeleton({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('space-y-3', className)} role="group" aria-label="Carregando resumo">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center justify-between gap-4">
          <Skeleton className="h-3 w-24" label="Carregando linha" />
          <Skeleton className="h-3 w-16" label="Carregando valor" />
        </div>
      ))}
      <div className="border-white/10 flex items-center justify-between gap-4 border-t pt-3">
        <Skeleton className="h-5 w-20" label="Carregando total" />
        <Skeleton className="h-5 w-24" label="Carregando total" />
      </div>
    </div>
  )
}

/** Form placeholder: stacked label + input blocks. */
export function FormSkeleton({ fields = 3, className }: { fields?: number; className?: string }) {
  return (
    <div className={cn('space-y-4', className)} role="group" aria-label="Carregando formulário">
      {Array.from({ length: fields }, (_, index) => (
        <div key={index} className="space-y-1.5">
          <Skeleton className="h-3 w-20" label="Carregando rótulo" />
          <Skeleton className="h-9 w-full" label="Carregando campo" />
        </div>
      ))}
    </div>
  )
}
