/**
 * Home hero — Figma `Top / Hero`: 1200x450 canvas, 40px left inset, 600px text
 * column, 110px gutter and a 450px square artwork with a 24px radius.
 */
export function HomeHero() {
  return (
    <section className="mx-auto w-full max-w-[1248px] px-6">
      <div className="relative flex flex-col items-start gap-8 overflow-hidden px-6 py-8 sm:px-8 lg:h-[450px] lg:flex-row lg:items-center lg:gap-[110px] lg:py-0 lg:pr-0 lg:pl-10">
        <div className="flex w-full flex-col gap-8 lg:w-[600px] lg:shrink-0">
          <div className="flex flex-col gap-1">
            <div className="flex flex-col gap-2">
              <p className="text-canvas text-sm leading-4 font-medium tracking-[0.1em]">
                Bem-vindo à Kurio
              </p>
              <h1 className="text-canvas text-[32px] leading-[1.2] font-bold sm:text-[43px] lg:leading-[70px]">
                SEJA DONO DO FUTURO
                <br />
                DA ARTE DIGITAL
              </h1>
            </div>
            <p className="text-text-secondary max-w-[557px] text-sm leading-6">
              Descubra NFTs selecionados de criadores emergentes e consolidados. Colecione arte
              digital rara, acompanhe lançamentos e apoie a cultura que define a propriedade
              digital.
            </p>
          </div>

          <a
            href="#produtos"
            className="bg-primary text-ink inline-flex h-10 w-[140px] items-center justify-start rounded-md pl-7 text-base leading-5 font-bold transition-[filter] hover:brightness-105"
          >
            EXPLORAR
          </a>

          <div className="mt-3 flex justify-end gap-2" aria-hidden>
            <span className="bg-primary size-2 rounded-full" />
            <span className="bg-primary size-2 rounded-full" />
            <span className="bg-primary size-2 rounded-full" />
          </div>
        </div>

        <img
          src="/images/Frame-136.webp"
          alt="Obra em destaque"
          className="h-[300px] w-full max-w-[450px] shrink-0 rounded-[24px] object-cover sm:h-[360px] sm:w-[360px] lg:size-[450px]"
        />
      </div>
    </section>
  )
}
