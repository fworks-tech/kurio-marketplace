import { Link } from '@tanstack/react-router'
import { useNftList } from '../catalog-queries'

const FALLBACK_IMAGE = '/images/nft-18.webp'
const FALLBACK_TITLE = 'NFT em destaque'

/**
 * The Figma panel draws this specific artwork, so the banner keeps it and links to
 * the work that owns it. Any other featured item is the fallback, which keeps the
 * click honest even when the catalog changes.
 */
const DESIGN_IMAGE = 'nft-18.webp'

/**
 * Sidebar "NFT em destaque" promo panel (Figma Featured NFT Banner), shown under
 * the filters.
 *
 * The artwork links to the highlighted work: the card is the entry point the
 * design implies, so the image lifts on hover and floats gently while idle. The
 * decorative shapes never capture the pointer.
 */
export function FeaturedNftBanner() {
  const featured = useNftList({ page: 1, pageSize: 28, featured: true, sort: 'featured' })
  const items = featured.data?.data ?? []
  const nft = items.find((item) => item.imageUrl?.endsWith(DESIGN_IMAGE)) ?? items[0]

  return (
    <div className="bg-gradient-panel-soft relative isolate flex flex-col items-center gap-4 overflow-hidden px-5 pt-6 pb-1">
      <p className="text-highlight text-center text-[24px] leading-8 font-bold">NFT EM DESTAQUE</p>
      <p className="text-canvas text-center text-[22px] leading-4 font-bold">OFERTA LIMITADA</p>

      {nft ? (
        <Link
          to="/nfts/$nftId"
          params={{ nftId: nft.id }}
          aria-label={`Ver detalhes de ${nft.title}`}
          data-testid="featured-nft-link"
          className="focus-visible:ring-highlight group relative block w-full rounded-[22px] focus-visible:ring-2 focus-visible:outline-none"
        >
          <img
            src={nft.imageUrl || FALLBACK_IMAGE}
            alt={nft.title || FALLBACK_TITLE}
            className="kurio-float h-[368px] w-full rounded-[22px] object-cover transition-[transform,box-shadow] duration-300 group-hover:scale-[1.03] group-hover:shadow-[0_24px_50px_-28px_rgba(232,155,85,0.9)] group-focus-visible:scale-[1.03]"
          />
        </Link>
      ) : (
        <img
          src={FALLBACK_IMAGE}
          alt={FALLBACK_TITLE}
          className="kurio-float h-[368px] w-full rounded-[22px] object-cover"
        />
      )}

      <span
        className="border-primary pointer-events-none absolute top-[299px] left-4 size-[22px] rounded-[7px] border-2 opacity-20"
        aria-hidden
      />
      <span
        className="bg-gradient-decor pointer-events-none absolute top-[105px] left-9 size-[15px] rounded-full"
        aria-hidden
      />
      <span
        className="bg-gradient-decor pointer-events-none absolute top-[343px] right-3 size-[45px] rounded-full"
        aria-hidden
      />
    </div>
  )
}
