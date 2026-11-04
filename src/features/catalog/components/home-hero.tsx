import { useCallback, useRef, useState } from "react";
import { ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { CarouselDots } from "@/shared/ui/carousel-dots";
import { cn } from "@/lib/utils";

/**
 * Three artworks behind the same promise. The images must stay visually
 * distinct, so each one comes from a different collection instead of reusing
 * the same monkey artwork twice.
 */
const HERO_SLIDES = [
  {
    src: "/images/Frame-136.webp",
    alt: "Primata de óculos escuros, obra em destaque da Kurio",
    collection: "Retratos digitais",
  },
  {
    src: "/images/nft-05.webp",
    alt: "Composição fotográfica da coleção Fotografia",
    collection: "Fotografia",
  },
  {
    src: "/images/nft-09.webp",
    alt: "Obra generativa em tons quentes da coleção Arte Digital",
    collection: "Arte digital",
  },
] as const;

const SWIPE_THRESHOLD = 48;

/**
 * Home hero, one tree for both frames:
 *
 * - Desktop `Hero`: 1200x450 canvas, 40px inset, 600px text column, 110px gutter
 *   and a 450px square artwork with a 24px radius.
 * - Mobile `Mobile / Início`: 366x190 card with a 12px radius, two warming
 *   orange washes behind the copy, a 188px text column, a 138px artwork with a
 *   58px thumbnail overlapping its corner and the dots inside the card, 12px
 *   above its bottom edge.
 *
 * Beyond the frames: the arrows, swipe and arrow-key navigation turn the static
 * dots into a real carousel.
 */
export function HomeHero() {
  const [slide, setSlide] = useState(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const total = HERO_SLIDES.length;
  const current = HERO_SLIDES[slide] ?? HERO_SLIDES[0];

  const go = useCallback(
    (step: number) => setSlide((index) => (index + step + total) % total),
    [total],
  );

  const onTouchStart = (event: React.TouchEvent) => {
    const touch = event.touches.item(0);
    if (!touch) return;
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const onTouchEnd = (event: React.TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const touch = event.changedTouches.item(0);
    if (!touch) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return;
    go(dx < 0 ? 1 : -1);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      go(1);
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(-1);
    }
  };

  const arrow =
    "border-primary/60 text-highlight hover:bg-primary hover:text-ink focus-visible:ring-highlight grid size-11 place-items-center rounded-full border transition duration-200 focus-visible:ring-2 focus-visible:outline-none active:scale-95";

  return (
    <section className="relative mx-auto w-full max-w-[1248px] px-6">
      <div
        role="group"
        aria-roledescription="carrossel"
        aria-label="Carrossel de obras em destaque"
        tabIndex={0}
        onKeyDown={onKeyDown}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className={cn(
          "relative flex items-start overflow-hidden rounded-[12px] bg-surface-card px-4 pt-[6px] focus-visible:outline-none",
          "h-[190px]",
          "lg:h-[450px] lg:items-center lg:gap-[110px] lg:rounded-lg lg:bg-transparent lg:px-6 lg:py-0 lg:pt-0 lg:pr-0 lg:pl-10",
        )}
      >
        {/* Mobile only: the warm washes drawn behind the copy. */}
        <span
          aria-hidden
          className="pointer-events-none absolute -top-[31px] -left-[56px] size-[248px] rounded-full bg-[radial-gradient(circle,rgba(221,154,95,0.43),rgba(210,138,76,0.04))] lg:hidden"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -top-[10px] left-[73px] size-[248px] rounded-full bg-[radial-gradient(circle,rgba(221,154,95,0.37),rgba(210,138,76,0))] lg:hidden"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/20 to-primary/10 lg:hidden"
        />

        <div className="relative flex w-[188px] shrink-0 flex-col lg:w-[600px] lg:gap-8">
          <div className="flex flex-col lg:gap-1">
            <div className="flex flex-col lg:gap-2">
              <p className="text-canvas text-xs leading-4 font-medium tracking-[0.1em] lg:text-sm">
                Bem-vindo à Kurio
              </p>
              <h1 className="text-canvas mt-[6px] text-lg leading-[29px] font-bold uppercase lg:mt-0 lg:text-[32px] lg:leading-[1.2] lg:tracking-normal sm:lg:text-[43px] lg:lg:leading-[70px]">
                <span className="lg:hidden">
                  SEJA DONO DA
                  <br />
                  CULTURA DIGITAL
                </span>
                <span className="hidden lg:inline">
                  SEJA DONO DO FUTURO
                  <br />
                  DA ARTE DIGITAL
                </span>
              </h1>
            </div>
            <p className="mt-[6px] line-clamp-3 text-xs leading-[18px] text-[#CFB28C] lg:mt-0 lg:line-clamp-none lg:max-w-[557px] lg:text-sm lg:leading-6">
              <span className="lg:hidden">Descubra NFTs selecionados de criadores do mundo todo.</span>
              <span className="hidden lg:inline">
                Descubra NFTs selecionados de criadores emergentes e consolidados. Colecione arte
                digital rara, acompanhe lançamentos e apoie a cultura que define a propriedade
                digital.
              </span>
            </p>
          </div>

          <a
            href="#produtos"
            className="text-highlight focus-visible:ring-highlight inline-flex items-center gap-2 text-xs leading-[14px] font-bold focus-visible:ring-2 focus-visible:outline-none lg:hidden"
          >
            EXPLORAR
            <ArrowRightIcon aria-hidden className="size-4" />
          </a>
          <a
            href="#produtos"
            className="bg-primary text-ink hidden h-10 w-[140px] items-center justify-center rounded-md text-base leading-5 font-bold transition-[filter] hover:brightness-105 lg:inline-flex"
          >
            EXPLORAR
          </a>
        </div>

        <div className="relative mt-[4px] ml-auto h-[146px] w-[138px] shrink-0 lg:mt-0 lg:ml-0 lg:h-[450px] lg:w-[450px]">
          <div className="relative size-[138px] overflow-hidden rounded-[16px] lg:size-[450px] lg:rounded-[24px]">
            {HERO_SLIDES.map((art, index) => (
              <img
                key={art.src}
                src={art.src}
                alt={index === slide ? art.alt : ""}
                aria-hidden={index !== slide}
                data-hero-slide={index}
                draggable={false}
                className={cn(
                  "absolute inset-0 size-full object-cover transition-[opacity,transform] duration-700 ease-out",
                  index === slide
                    ? "scale-100 opacity-100"
                    : "pointer-events-none scale-105 opacity-0",
                )}
              />
            ))}
          </div>
          {/* Mobile only: the 58px thumbnail tucked into the artwork corner. */}
          <img
            src={HERO_SLIDES[(slide + 1) % total]?.src}
            alt=""
            aria-hidden
            draggable={false}
            className="absolute top-[88px] -left-[10px] size-[58px] rounded-[16px] object-cover lg:hidden"
          />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-[5px] flex justify-center lg:pointer-events-auto lg:static lg:mt-8 lg:justify-center lg:gap-4">
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Obra anterior"
          className={cn(arrow, "mr-4 hidden lg:grid")}
        >
          <ChevronLeftIcon aria-hidden className="size-5" />
        </button>
        <div className="pointer-events-auto">
          <CarouselDots
            count={total}
            index={slide}
            onChange={setSlide}
            label="Obras em destaque"
            size="sm"
          />
        </div>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Próxima obra"
          className={cn(arrow, "ml-4 hidden lg:grid")}
        >
          <ChevronRightIcon aria-hidden className="size-5" />
        </button>
      </div>

      <p className="sr-only" aria-live="polite">
        Obra {slide + 1} de {total}: {current.alt} ({current.collection})
      </p>
    </section>
  );
}
