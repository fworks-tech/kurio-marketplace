import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  HeartIcon,
  Link2Icon,
  MessageCircleIcon,
  MinusIcon,
  PlusIcon,
  StarIcon,
} from "lucide-react";
import { notify } from "@/shared/ui/toast";
import { formatTokenId } from "@/shared/lib/format";
import { ErrorState } from "@/shared/ui/error-state";
import { Skeleton } from "@/shared/ui/skeleton";
import { Gallery } from "./components/gallery";
import { DetailTabs } from "./components/detail-tabs";
import { ReviewList } from "./components/review-list";
import { NftGrid } from "@/features/catalog/components/nft-grid";
import {
  useFavorites,
  useToggleFavorite,
} from "@/features/favorites/use-toggle-favorite";
import { useSession } from "@/features/session/session-queries";
import { PriceDisplay } from "@/shared/ui/price-display";
import { ShoppingCartIcon } from "lucide-react";
import { useAddToCart } from "@/features/cart/cart-queries";
import { addGuestItem } from "@/features/cart/guest-cart";
import { quantityLimits, stepQuantity } from "@/shared/lib/quantity";
import {
  remainingEditions,
  useNftDetail,
  useRelatedNfts,
} from "./detail-queries";
import { CarouselDots } from "@/shared/ui/carousel-dots";
import { cn } from "@/lib/utils";

interface ItemDetailScreenProps {
  nftId: string;
  onRequireAuth: () => void;
}

const SECTION_LABEL = "text-canvas text-[15px] leading-4 font-bold";
const META_LINE = "text-sand text-[15px] leading-[19.8px]";

export function ItemDetailScreen({
  nftId,
  onRequireAuth,
}: ItemDetailScreenProps) {
  const detail = useNftDetail(nftId);
  const related = useRelatedNfts(nftId);
  const { data: session } = useSession();
  const favorites = useFavorites();
  const toggleFavorite = useToggleFavorite(nftId);
  const addToCart = useAddToCart();
  const [quantity, setQuantity] = useState(1);
  const [tab, setTab] = useState("detalhes");
  const relatedPageSize = useRelatedPageSize();
  const [relatedPage, setRelatedPage] = useState(0);

  const reviews = detail.data?.reviews ?? [];
  const average = useMemo(
    () =>
      reviews.length
        ? reviews.reduce((sum, review) => sum + review.rating, 0) /
          reviews.length
        : 0,
    [reviews],
  );

  if (detail.isLoading) return <DetailSkeleton />;
  if (detail.isError) {
    return (
      <Shell>
        <ErrorState
          message="Não foi possível carregar este NFT."
          onRetry={() => detail.refetch()}
        />
      </Shell>
    );
  }
  if (!detail.data) {
    return (
      <Shell>
        <h1 className="text-2xl font-bold">NFT não encontrado</h1>
        <p className="text-text-secondary mt-2 text-sm">
          O item que você procura não existe ou saiu do ar.
        </p>
        <Link
          to="/"
          className="mt-4 inline-block text-sm font-semibold underline"
        >
          Voltar ao mercado
        </Link>
      </Shell>
    );
  }

  const nft = detail.data;
  const remaining = remainingEditions(nft);
  const soldOut = !nft.isAvailable || remaining === 0;
  const isFavorite = session
    ? (favorites.data?.favorites ?? []).some((f) => f.id === nftId)
    : nft.isFavorite;

  const handleFavorite = () => {
    if (!session) return onRequireAuth();
    toggleFavorite.mutate(isFavorite);
  };

  const handleBuy = () => {
    if (!session) {
      addGuestItem(nftId, quantity);
      notify.success("Salvo no carrinho. Entre para finalizar a compra.");
      return;
    }
    addToCart.mutate(
      { nftId, quantity },
      { onSuccess: () => notify.success("Adicionado ao carrinho.") },
    );
  };

  const handleShare = () => {
    void navigator.clipboard
      .writeText(window.location.href)
      .then(() => notify.success("Link copiado."))
      .catch(() => notify.error("Não foi possível copiar o link."));
  };

  // Figma Gallery/Thumbnails: quatro miniaturas de 100px; o mock entrega uma arte por NFT.
  const galleryImages = Array.from({ length: 4 }, (_, index) => ({
    src: nft.imageUrl,
    alt: index === 0 ? nft.title : `${nft.title} — imagem ${index + 1}`,
  }));

  const tokenId = `#${nft.id.replace(/\D/g, "").slice(-4).padStart(4, "0")}`;
  const attributes = (nft.attributes ?? []).map((attribute) =>
    String(attribute.value),
  );
  const limits = quantityLimits(quantity, 1, Math.max(1, remaining));

  const detailsContent = (
    <div className="flex flex-col gap-3">
      <p className="text-text-secondary max-w-[1200px] text-sm leading-6">
        {nft.description}
      </p>
      <dl className="text-sm leading-6">
        <dt className={cn(SECTION_LABEL, "text-sm leading-6")}>Rede:</dt>
        <dd className="text-text-secondary">
          Cunhado na {nft.network ?? "Ethereum"} com procedência imutável e
          metadados armazenados no IPFS.
        </dd>
        <dt className={cn(SECTION_LABEL, "mt-3 text-sm leading-6")}>
          Contrato:
        </dt>
        <dd className="text-text-secondary">
          Direitos autorais do criador: {nft.royalty}% nas vendas secundárias,
          pagos automaticamente pelos marketplaces compatíveis.
        </dd>
        <dt className={cn(SECTION_LABEL, "mt-3 text-sm leading-6")}>
          Direitos autorais:
        </dt>
        <dd className="text-text-secondary">
          0x7A42…19E8 • Contrato inteligente ERC-721 verificado.
        </dd>
      </dl>
    </div>
  );

  return (
    <main className="mx-auto flex min-h-[calc(100dvh-70px)] max-w-[1248px] flex-col px-6 pt-0 pb-0 lg:block lg:min-h-0 lg:pt-8 lg:pb-8">
      <nav
        aria-label="Trilha de navegação"
        className="text-canvas hidden text-[15px] leading-4 font-bold lg:block"
      >
        <Link to="/" className="hover:text-highlight">
          Início
        </Link>
        <span className="text-text-secondary"> / </span>
        <Link to="/" className="hover:text-highlight">
          Mercado
        </Link>
      </nav>

      {/* Mobile / Detalhes: 506px hero, then the sheet 114px over it, then the fixed buy bar. */}
      <div className="lg:hidden">
        <div className="relative -mx-6 h-[506px] pt-[66px]">
          <img
            src={nft.imageUrl}
            alt={nft.title}
            className="ml-7 h-[356px] w-[361px] rounded-[24px] object-cover"
          />
          <div className="absolute inset-x-0 top-[365px] flex justify-center">
            <div className="flex h-[7px] w-[56px] items-center gap-[7px]">
              <span className="h-[7px] w-[28px] rounded-[25px] bg-[#D28A4C]" />
              <span className="size-[7px] rounded-full bg-[#D28A4C]" />
              <span className="size-[7px] rounded-full bg-[#D28A4C]" />
            </div>
          </div>
        </div>

        <div className="bg-surface-card relative -mx-6 mt-[-114px] px-6 pt-8 pb-7">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-canvas min-w-0 flex-1 text-[20px] leading-4 font-bold">{nft.title}</h1>
            <Rating average={average} count={reviews.length} />
          </div>
          <p className="text-sand mt-3 line-clamp-4 text-sm leading-6">{nft.description}</p>

          <div className="mt-6">
            <h2 className={SECTION_LABEL}>Edição:</h2>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="border-field text-canvas inline-flex h-7 items-center rounded-pill border px-2 text-sm leading-4">
                {nft.edition}/{nft.totalEdition}
              </span>
              <span
                className={cn(
                  "inline-flex h-7 items-center rounded-pill border px-2 text-sm leading-4",
                  soldOut
                    ? "border-field text-text-secondary"
                    : "border-primary text-highlight font-medium",
                )}
              >
                {soldOut ? "ESGOTADA" : "ABERTA"}
              </span>
            </div>
          </div>

          <dl className={cn(META_LINE, "mt-8")}>
            <div>ID do token: {formatTokenId(tokenId)}</div>
            <div>Coleção: {collectionLabel(nft.collectionId)}</div>
            <div>
              Atributos: {attributes.length ? attributes.join(", ") : "—"}
            </div>
          </dl>
        </div>
      </div>

      {/* Figma `Buy Bar`: 164px bar with the 30px quantity row and a 60px pill. */}
      <div className="bg-surface-card sticky bottom-0 z-40 mt-auto -mx-6 px-6 pt-5 pb-9 lg:hidden">
        <div className="flex h-[30px] items-center gap-3">
          <span className="text-sand text-[15px] leading-4 font-medium">Qtd.</span>
          <div className="flex h-[30px] w-[75px] items-center justify-between">
            <button
              type="button"
              aria-label="Diminuir quantidade"
              disabled={limits.atMin}
              onClick={() =>
                setQuantity(stepQuantity(quantity, -1, 1, Math.max(1, remaining)))
              }
              className="bg-primary text-ink grid h-[30px] w-5 place-items-center rounded-[20px] disabled:opacity-40"
            >
              <MinusIcon aria-hidden className="size-[9px]" />
            </button>
            <span className="text-canvas w-[11px] text-center text-lg leading-4 font-medium tabular-nums">
              {quantity}
            </span>
            <button
              type="button"
              aria-label="Aumentar quantidade"
              disabled={limits.atMax}
              onClick={() =>
                setQuantity(stepQuantity(quantity, 1, 1, Math.max(1, remaining)))
              }
              className="bg-primary text-ink grid h-[30px] w-5 place-items-center rounded-[20px] disabled:opacity-40"
            >
              <PlusIcon aria-hidden className="size-[9px]" />
            </button>
          </div>
          <PriceDisplay
            value={nft.price}
            className="text-price ml-auto text-[20px] leading-4 font-bold"
          />
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={handleBuy}
            disabled={soldOut || addToCart.isPending}
            className="bg-primary text-ink h-[60px] w-[196px] rounded-[40px] text-base leading-5 font-bold disabled:opacity-50"
          >
            {soldOut ? "Esgotado" : addToCart.isPending ? "Comprando…" : "Comprar NFT"}
          </button>
          <button
            type="button"
            onClick={handleBuy}
            aria-label={`Adicionar ${nft.title} ao carrinho`}
            disabled={soldOut || addToCart.isPending}
            className="grid size-[60px] place-items-center rounded-[40px] bg-[#2F1D15] disabled:opacity-50"
          >
            <ShoppingCartIcon aria-hidden className="size-5 text-[#B39463]" />
          </button>
        </div>
      </div>

      <div className="mt-3 hidden gap-8 lg:grid lg:grid-cols-[573px_1fr] lg:gap-8">
        <Gallery images={galleryImages} />

        <div className="flex flex-col justify-between gap-5">
          <div className="flex flex-col gap-3">
            <h1 className="text-canvas text-[20px] leading-4 font-bold sm:text-[28px] sm:leading-[37px]">
              {nft.title}
            </h1>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-highlight text-[22px] leading-4 font-bold">
                {nft.price} ETH
              </p>
              <Rating average={average} count={reviews.length} />
            </div>
            <div className="border-primary/30 border-t-[0.3px]" />
          </div>

          <div className="flex flex-col gap-3">
            <h2 className={SECTION_LABEL}>Sobre este NFT:</h2>
            <p className="text-text-secondary text-sm leading-6">
              {nft.description}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className={SECTION_LABEL}>Edição:</h2>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="border-field text-canvas inline-flex h-7 items-center rounded-pill border px-2 text-sm leading-4">
                {nft.edition}/{nft.totalEdition}
              </span>
              <span
                className={cn(
                  "inline-flex h-7 items-center rounded-pill border px-2 text-sm leading-4",
                  soldOut
                    ? "border-field text-text-secondary"
                    : "border-primary text-highlight font-medium",
                )}
              >
                {soldOut ? "ESGOTADA" : "ABERTA"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Figma Frame 48: dois botões de 33x50 em #D28A4C com borda #140D0A e o número em 20/28. */}
            <div className="flex h-[50px] w-[103px] items-center justify-between">
              <button
                type="button"
                aria-label="Diminuir quantidade"
                disabled={limits.atMin}
                onClick={() =>
                  setQuantity(
                    stepQuantity(quantity, -1, 1, Math.max(1, remaining)),
                  )
                }
                className="bg-primary text-ink border-ink grid h-[50px] w-[33px] place-items-center rounded-pill border disabled:opacity-40"
              >
                <MinusIcon aria-hidden className="size-[15px]" />
              </button>
              <span className="text-canvas w-[13px] text-center text-[20px] leading-7 tabular-nums">
                {quantity}
              </span>
              <button
                type="button"
                aria-label="Aumentar quantidade"
                disabled={limits.atMax}
                onClick={() =>
                  setQuantity(
                    stepQuantity(quantity, 1, 1, Math.max(1, remaining)),
                  )
                }
                className="bg-primary text-ink border-ink grid h-[50px] w-[33px] place-items-center rounded-pill border disabled:opacity-40"
              >
                <PlusIcon aria-hidden className="size-[15px]" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBuy}
                disabled={soldOut || addToCart.isPending}
                className="bg-primary text-ink h-10 w-[130px] rounded-md text-sm leading-5 font-bold disabled:opacity-50"
              >
                {soldOut
                  ? "ESGOTADO"
                  : addToCart.isPending
                    ? "COMPRANDO…"
                    : "COMPRAR"}
              </button>
              <button
                type="button"
                aria-pressed={isFavorite}
                onClick={handleFavorite}
                className="border-primary text-highlight inline-flex h-10 w-[130px] items-center justify-center gap-2 rounded-md border text-sm leading-5 font-medium"
              >
                <HeartIcon
                  aria-hidden
                  className={cn("size-5", isFavorite && "fill-highlight")}
                />
                Favoritar
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <dl className={META_LINE}>
              <div>ID do token: {formatTokenId(tokenId)}</div>
              <div>Coleção: {collectionLabel(nft.collectionId)}</div>
              <div>
                Atributos: {attributes.length ? attributes.join(", ") : "—"}
              </div>
            </dl>
            <div className="flex flex-wrap items-center gap-2">
              <span className={SECTION_LABEL}>Compartilhar este NFT:</span>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                  typeof window === "undefined" ? "" : window.location.href,
                )}`}
                target="_blank"
                rel="noreferrer"
                aria-label="Compartilhar no LinkedIn"
                className="text-canvas hover:text-highlight"
              >
                <LinkedInMark />
              </a>
              <button
                type="button"
                onClick={handleShare}
                aria-label="Copiar link do NFT"
                className="text-canvas hover:text-highlight"
              >
                <MessageCircleIcon aria-hidden className="size-[18px]" />
              </button>
              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
                  typeof window === "undefined" ? "" : window.location.href,
                )}`}
                target="_blank"
                rel="noreferrer"
                aria-label="Compartilhar no Twitter"
                className="text-canvas hover:text-highlight"
              >
                <TwitterMark />
              </a>
              <button
                type="button"
                onClick={handleShare}
                aria-label="Copiar link do NFT"
                className="text-canvas hover:text-highlight ml-1"
              >
                <Link2Icon aria-hidden className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <section aria-labelledby="detalhes-heading" className="mt-12">
        <h2 id="detalhes-heading" className="sr-only">
          Detalhes do NFT
        </h2>
        <DetailTabs
          value={tab}
          onChange={setTab}
          tabs={[
            {
              value: "detalhes",
              label: "Detalhes do NFT",
              content: detailsContent,
            },
            {
              value: "avaliacoes",
              label: `Avaliações de colecionadores (${reviews.length})`,
              content: <ReviewList reviews={reviews} />,
            },
          ]}
        />
      </section>

      {related.length > 0 ? (
        <section className="mt-12">
          <h2 className="text-highlight text-[17px] leading-4 font-bold">
            Mais desta coleção
          </h2>
          <div className="border-primary/30 mt-3 border-t-[0.3px]" />
          <NftGrid
            items={related.slice(
              relatedPage * relatedPageSize,
              (relatedPage + 1) * relatedPageSize,
            )}
            variant="compact"
            className="mt-8"
          />
          {/* Figma Carousel Dots: 12px, 8px de intervalo, controle central preenchido. */}
          <CarouselDots
            count={Math.ceil(related.length / relatedPageSize)}
            index={relatedPage}
            onChange={setRelatedPage}
            label="Mais desta coleção"
            className="mt-8 justify-center"
          />
          <p className="sr-only" aria-live="polite">
            Página {relatedPage + 1} de{" "}
            {Math.ceil(related.length / relatedPageSize)}
          </p>
        </section>
      ) : null}
    </main>
  );
}

/**
 * The grid shows three cards from `lg` up and one below it, matching the Figma
 * desktop/mobile frames, so a dot group always needs one page per visible screen.
 */
function useRelatedPageSize(): number {
  const [size, setSize] = useState(3);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const apply = () => setSize(query.matches ? 3 : 1);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  return size;
}

/** O contrato devolve o id da coleção; a tela mostra o rótulo legível (`arte-digital` → `Arte Digital`). */
function collectionLabel(collectionId?: string): string {
  if (!collectionId) return "—";
  return collectionId
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/** Marcas sociais: o lucide não distribui logos de terceiros, então vão como SVG. */
function LinkedInMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="size-[15px]"
      fill="currentColor"
    >
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm6 0h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.5 4.78 5.75V21h-4v-5.6c0-1.34-.02-3.06-1.87-3.06-1.87 0-2.16 1.46-2.16 2.96V21H9V9Z" />
    </svg>
  );
}

function TwitterMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4" fill="currentColor">
      <path d="M22 5.8c-.7.3-1.5.6-2.3.7.8-.5 1.5-1.3 1.8-2.3-.8.5-1.7.8-2.6 1A4 4 0 0 0 12 9.2a11.4 11.4 0 0 1-8.3-4.2 4 4 0 0 0 1.2 5.4c-.6 0-1.2-.2-1.8-.5a4 4 0 0 0 3.2 4 4 4 0 0 1-1.8.1 4 4 0 0 0 3.7 2.8A8 8 0 0 1 2 18.6 11.3 11.3 0 0 0 8.2 20c7.5 0 11.6-6.2 11.6-11.6v-.5c.8-.6 1.5-1.3 2.2-2.1Z" />
    </svg>
  );
}

/** Figma `Frame 40`: cinco estrelas de 15px e a contagem em 15px. */
function Rating({ average, count }: { average: number; count: number }) {
  return (
    <div className="flex items-center gap-1">
      <span className="flex items-center gap-1" aria-hidden>
        {Array.from({ length: 5 }, (_, index) => (
          <StarIcon
            key={index}
            className={cn(
              "size-[15px]",
              index < Math.round(average)
                ? "fill-primary text-primary"
                : "fill-sand text-sand",
            )}
          />
        ))}
      </span>
      <span className="text-canvas text-[15px] leading-[19.8px]">
        {count}{" "}
        {count === 1
          ? "avaliação de colecionador"
          : "avaliações de colecionadores"}
      </span>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <Shell>
      <div className="grid gap-8 lg:grid-cols-[573px_1fr]">
        <Skeleton
          className="aspect-square w-full max-w-[444px]"
          label="Carregando galeria"
        />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-9 w-2/3" label="Carregando título" />
          <Skeleton className="h-6 w-40" label="Carregando preço" />
          <Skeleton className="h-24 w-full" label="Carregando descrição" />
          <Skeleton className="h-10 w-64" label="Carregando ações" />
        </div>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-[1248px] px-4 py-8 sm:px-6">{children}</main>
  );
}
