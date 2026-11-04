import { ArrowRightIcon } from 'lucide-react'

const PROMOS = [
  {
    title: 'Limited-edition\ngenesis drops',
    body: 'Colecione edições escassas diretamente dos criadores antes da revelação pública.',
    image: '/images/nft-06.webp'
  },
  {
    title: 'Curated digital art\n& much more',
    body: 'Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.',
    image: '/images/nft-09.webp'
  }
]

/** Home promo cards (Figma "Promos") — two side-by-side editorial banners. */
export function HomePromos() {
  return (
    <section className="mx-auto w-full max-w-[1248px] px-6">
      <div className="flex flex-col gap-7 lg:flex-row">
        {PROMOS.map((promo) => (
          <article
            key={promo.image}
            className="bg-surface-card relative flex h-[250px] flex-1 overflow-hidden rounded-lg"
          >
            <img
              src={promo.image}
              alt=""
              aria-hidden
              className="hidden h-full w-[46%] shrink-0 rounded-[18px] object-cover sm:block"
            />
            <div className="flex flex-1 flex-col items-end justify-center gap-3 px-6 py-6 text-right">
              <h3 className="text-canvas text-lg leading-6 font-bold whitespace-pre-line">{promo.title}</h3>
              <p className="text-text-secondary max-w-[280px] text-sm leading-6">{promo.body}</p>
              <a
                href="#produtos"
                className="bg-primary text-ink mt-1 inline-flex h-10 w-[140px] items-center justify-center gap-1 rounded-md text-sm font-medium transition-[filter] hover:brightness-105"
              >
                Explorar
                <ArrowRightIcon aria-hidden className="size-4" />
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
