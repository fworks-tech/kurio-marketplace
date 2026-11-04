import { Link } from '@tanstack/react-router'
import { HeartIcon, SearchIcon, ShoppingCartIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PriceDisplay } from '@/shared/ui/price-display'
import { formatPrice } from '@/shared/lib/format'
import { CatalogBadge } from './catalog-badge'
import type { CatalogNft } from '../catalog-types'

interface NftCardProps {
  nft: CatalogNft
  onToggleFavorite?: (id: string) => void
  onAddToCart?: (id: string) => void
  /** `compact` matches the 219px related rails on the detail, cart and payment frames. */
  variant?: 'default' | 'compact'
  className?: string
}

/**
 * Figma `Frame 141` (home grid): 258x356 card — 258x300 artwork area holding a
 * 250x250 image (radius 15, 31px from the top), title 16/16, price 18/16 bold in
 * `#E89B55`, 12px between the blocks.
 *
 * The three card actions (cart, favorite, view) sit centred over the bottom of the
 * artwork and only appear on hover or keyboard focus; touch devices without hover
 * keep them visible, since tapping replaces hovering.
 */
export function NftCard({
  nft,
  onToggleFavorite,
  onAddToCart,
  variant = 'default',
  className
}: NftCardProps) {
  const compact = variant === 'compact'
  const soldOut = nft.isAvailable === false

  const actionClass =
    'bg-ink/70 border-field text-canvas hover:text-highlight focus-visible:ring-highlight grid size-8 place-items-center rounded-full border backdrop-blur transition-colors focus-visible:ring-2 focus-visible:outline-none'

  return (
    <article className={cn('kurio-card group flex flex-col self-start', className)}>
      <div
        className={cn(
          'bg-surface-card relative rounded-[20px] lg:rounded-[14px]',
          compact
            ? 'grid aspect-[219/255] place-items-center p-1'
            : 'aspect-[175/200] px-1 pt-3 pb-5 lg:aspect-[258/300] lg:pt-[31px] lg:pb-[19px]'
        )}
      >
        <Link
          to="/nfts/$nftId"
          params={{ nftId: nft.id }}
          className={cn(
            'relative block w-full overflow-hidden rounded-[16px] focus-visible:ring-highlight focus-visible:ring-2 focus-visible:outline-none lg:rounded-[15px]',
            compact ? 'mx-auto max-w-[190px]' : 'mx-auto max-w-[250px]'
          )}
        >
          <img
            src={nft.imageUrl}
            alt={nft.title}
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.visibility = 'hidden'
            }}
            className="aspect-square w-full object-cover"
          />
          {!compact && nft.badges?.length ? (
            <div className="absolute top-2 left-2 flex flex-wrap gap-2">
              {nft.badges.map((kind) => (
                <CatalogBadge key={kind} kind={kind} />
              ))}
            </div>
          ) : null}
          {onToggleFavorite ? (
            <button
              type="button"
              aria-pressed={Boolean(nft.isFavorite)}
              aria-label={
                nft.isFavorite ? `Remover ${nft.title} dos favoritos` : `Favoritar ${nft.title}`
              }
              onClick={() => onToggleFavorite(nft.id)}
              className="absolute top-3 right-3 grid size-7 place-items-center rounded-full bg-[#2F1D15] lg:hidden"
            >
              <HeartIcon
                aria-hidden
                className={cn(
                  'size-[15px]',
                  nft.isFavorite ? 'fill-highlight text-highlight' : 'text-highlight'
                )}
              />
            </button>
          ) : null}
          {soldOut ? (
            <div className="bg-ink/70 absolute inset-0 flex items-center justify-center">
              <span className="rounded-pill border border-white/30 px-3 py-1 text-sm font-semibold">
                Esgotado
              </span>
            </div>
          ) : null}
        </Link>

        {onToggleFavorite || onAddToCart ? (
          <div
            data-card-actions
            className="pointer-events-none absolute inset-x-0 bottom-[19px] hidden justify-center gap-2 lg:flex opacity-0 transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 motion-reduce:transition-none [@media(hover:none)]:pointer-events-auto [@media(hover:none)]:opacity-100"
          >
            {onAddToCart ? (
              <button
                type="button"
                aria-label={`Adicionar ${nft.title} ao carrinho`}
                disabled={soldOut}
                onClick={() => onAddToCart(nft.id)}
                className={cn(actionClass, 'disabled:cursor-not-allowed disabled:opacity-40')}
              >
                <ShoppingCartIcon aria-hidden className="size-4" />
              </button>
            ) : null}

            {onToggleFavorite ? (
              <button
                type="button"
                aria-pressed={Boolean(nft.isFavorite)}
                aria-label={
                  nft.isFavorite ? `Remover ${nft.title} dos favoritos` : `Favoritar ${nft.title}`
                }
                onClick={() => onToggleFavorite(nft.id)}
                className={actionClass}
              >
                <HeartIcon
                  aria-hidden
                  className={cn('size-4', nft.isFavorite && 'fill-highlight text-highlight')}
                />
              </button>
            ) : null}

            <Link
              to="/nfts/$nftId"
              params={{ nftId: nft.id }}
              aria-label={`Ver detalhes de ${nft.title}`}
              className={actionClass}
            >
              <SearchIcon aria-hidden className="size-4" />
            </Link>
          </div>
        ) : null}
      </div>

      <h3
        className={cn(
          'text-canvas truncate font-normal',
          compact ? 'mt-2' : 'mt-2 lg:mt-3',
          compact ? 'text-[15px] leading-4' : 'text-[15px] leading-[19.8px] lg:text-base lg:leading-4'
        )}
      >
        {nft.title}
      </h3>

      <div className="mt-0 flex items-center gap-3 lg:mt-3">
        <PriceDisplay
          value={nft.priceEth}
          className={cn(compact ? 'text-base' : 'text-base lg:text-lg', 'text-price leading-4 font-bold')}
        />
        {nft.previousPriceEth ? (
          <span className="text-sand text-lg leading-4 line-through">
            {formatPrice(nft.previousPriceEth)}
          </span>
        ) : null}
      </div>
    </article>
  )
}
