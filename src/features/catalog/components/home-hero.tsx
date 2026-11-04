import { useCallback, useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
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
 * Home hero — Figma `Top / Hero`: 1200x450 canvas, 40px left inset, 600px text
 * column, 110px gutter and a 450px square artwork with a 24px radius.
 *
 * Beyond the frame: the arrows, swipe and arrow-key navigation turn the static
 * dots into a real carousel, and the controls sit centered under the card.
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
    <section className="mx-auto w-full max-w-[1248px] px-6">
      <div
        role="group"
        aria-roledescription="carrossel"
        aria-label="Carrossel de obras em destaque"
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="relative flex flex-col items-start gap-8 overflow-hidden rounded-lg px-6 py-8 focus-visible:outline-none sm:px-8 lg:h-[450px] lg:flex-row lg:items-center lg:gap-[110px] lg:py-0 lg:pr-0 lg:pl-10"
      >
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
              Descubra NFTs selecionados de criadores emergentes e consolidados.
              Colecione arte digital rara, acompanhe lançamentos e apoie a
              cultura que define a propriedade digital.
            </p>
          </div>

          <a
            href="#produtos"
            className="bg-primary text-ink inline-flex h-10 w-[140px] items-center justify-center rounded-md text-base leading-5 font-bold transition-[filter] hover:brightness-105"
          >
            EXPLORAR
          </a>
        </div>

        <div
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          className="relative h-[300px] w-full max-w-[450px] shrink-0 overflow-hidden rounded-[24px] sm:h-[360px] sm:w-[360px] lg:size-[450px]"
        >
          {HERO_SLIDES.map((art, index) => (
            <img
              key={art.src}
              src={art.src}
              alt={index === slide ? art.alt : ""}
              aria-hidden={index !== slide}
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
      </div>

      <div className="mt-8 flex items-center justify-center gap-4">
        <button type="button" onClick={() => go(-1)} aria-label="Obra anterior" className={arrow}>
          <ChevronLeftIcon aria-hidden className="size-5" />
        </button>
        <CarouselDots
          count={total}
          index={slide}
          onChange={setSlide}
          label="Obras em destaque"
          size="sm"
        />
        <button type="button" onClick={() => go(1)} aria-label="Próxima obra" className={arrow}>
          <ChevronRightIcon aria-hidden className="size-5" />
        </button>
      </div>

      <p className="sr-only" aria-live="polite">
        Obra {slide + 1} de {total}: {current.alt} ({current.collection})
      </p>
    </section>
  );
}
