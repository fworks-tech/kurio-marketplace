/** Sidebar "NFT em destaque" promo panel (Figma Featured NFT Banner), shown under the filters. */
export function FeaturedNftBanner() {
  return (
    <div className="bg-gradient-panel-soft relative isolate flex flex-col items-center gap-4 overflow-hidden px-5 pt-6 pb-1">
      <p className="text-highlight text-center text-[24px] leading-8 font-bold">NFT EM DESTAQUE</p>
      <p className="text-canvas text-center text-[22px] leading-4 font-bold">OFERTA LIMITADA</p>
      <img
        src="/images/nft-18.webp"
        alt="NFT em destaque"
        className="h-[360px] w-full rounded-[22px] object-cover"
      />
      <span className="bg-gradient-decor absolute top-[105px] left-9 size-[15px] rounded-full" aria-hidden />
      <span className="bg-gradient-decor absolute top-[343px] right-3 size-[45px] rounded-full" aria-hidden />
    </div>
  )
}
