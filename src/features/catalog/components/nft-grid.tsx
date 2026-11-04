import { cn } from '@/lib/utils'
import { EmptyState } from '@/shared/ui/empty-state'
import { ErrorState } from '@/shared/ui/error-state'
import { NftCard } from './nft-card'
import { NftCardSkeleton } from './nft-card-skeleton'
import type { CatalogNft } from '../catalog-types'

const GRID_CLASS =
  'grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-8 md:gap-y-[72px] [&>*:nth-child(even)]:mt-8 md:[&>*:nth-child(even)]:mt-0'
/** Five 219px cards with a 28px gutter — the related rails on detail/cart/payment. */
const COMPACT_GRID_CLASS = 'grid grid-cols-2 gap-x-7 gap-y-8 sm:grid-cols-3 lg:grid-cols-5 lg:gap-x-[26px]'

interface NftGridProps {
  items?: CatalogNft[]
  loading?: boolean
  error?: string
  skeletonCount?: number
  emptyTitle?: string
  emptyDescription?: string
  onToggleFavorite?: (id: string) => void
  onAddToCart?: (id: string) => void
  onRetry?: () => void
  onClearFilters?: () => void
  variant?: 'default' | 'compact'
  className?: string
}

export function NftGrid({
  items,
  loading,
  error,
  skeletonCount = 8,
  emptyTitle = 'Nenhum NFT encontrado',
  emptyDescription,
  onToggleFavorite,
  onAddToCart,
  onRetry,
  onClearFilters,
  variant = 'default',
  className
}: NftGridProps) {
  const gridClass = variant === 'compact' ? COMPACT_GRID_CLASS : GRID_CLASS
  if (loading) {
    return (
      <div className={cn(gridClass, className)}>
        {Array.from({ length: skeletonCount }, (_, index) => (
          <NftCardSkeleton key={index} />
        ))}
      </div>
    )
  }

  if (error) {
    return <ErrorState message={error} onRetry={onRetry} className={className} />
  }

  if (!items?.length) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={onClearFilters ? 'Limpar filtros' : undefined}
        onAction={onClearFilters}
        className={className}
      />
    )
  }

  return (
    <div className={cn(gridClass, className)}>
      {items.map((nft) => (
        <NftCard
          key={nft.id}
          nft={nft}
          variant={variant}
          onToggleFavorite={onToggleFavorite}
          onAddToCart={onAddToCart}
        />
      ))}
    </div>
  )
}
