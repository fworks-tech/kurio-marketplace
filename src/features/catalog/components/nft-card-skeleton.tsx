import { cn } from '@/lib/utils'
import { Skeleton } from '@/shared/ui/skeleton'

export function NftCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'bg-surface-card shadow-card overflow-hidden rounded-card border border-white/10',
        className
      )}
    >
      <Skeleton className="aspect-square w-full rounded-none" label="Carregando imagem" />
      <div className="flex items-start justify-between gap-2 p-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" label="Carregando título" />
          <Skeleton className="h-3 w-20" label="Carregando coleção" />
        </div>
        <Skeleton className="h-4 w-16" label="Carregando preço" />
      </div>
    </div>
  )
}
