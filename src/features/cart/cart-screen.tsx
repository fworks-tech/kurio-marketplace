import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ChevronLeftIcon } from 'lucide-react'
import { Breadcrumb } from '@/shared/ui/breadcrumb'
import { EmptyState } from '@/shared/ui/empty-state'
import { ErrorState } from '@/shared/ui/error-state'
import { Skeleton } from '@/shared/ui/skeleton'
import { Button } from '@/components/ui/button'
import { CartItemRow } from './components/cart-item-row'
import { CouponField } from './components/coupon-field'
import { OrderSummary } from '@/features/payment/components/order-summary'
import { NftGrid } from '@/features/catalog/components/nft-grid'
import { CarouselDots } from '@/shared/ui/carousel-dots'
import { toCatalogNft, useNftList } from '@/features/catalog/catalog-queries'
import {
  cartLineMax,
  useCart,
  useQuote,
  useRemoveCartItem,
  useUpdateCartQuantity
} from './cart-queries'

/**
 * The related rail shows 2, 3 or 5 cards depending on the breakpoint, so one dot
 * always stands for one visible screen (`COMPACT_GRID_CLASS` in `NftGrid`).
 */
function useVisibleCardCount(): number {
  const [count, setCount] = useState(5)

  useEffect(() => {
    const wide = window.matchMedia('(min-width: 1024px)')
    const medium = window.matchMedia('(min-width: 640px)')
    const apply = () => setCount(wide.matches ? 5 : medium.matches ? 3 : 2)
    apply()
    wide.addEventListener('change', apply)
    medium.addEventListener('change', apply)
    return () => {
      wide.removeEventListener('change', apply)
      medium.removeEventListener('change', apply)
    }
  }, [])

  return count
}

interface CartScreenProps {
  authenticated: boolean
  onCheckout: () => void
  onExplore: () => void
}

export function CartScreen({ authenticated, onCheckout, onExplore }: CartScreenProps) {
  const cart = useCart()
  const [couponInput, setCouponInput] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<string | undefined>()
  const [relatedPage, setRelatedPage] = useState(0)
  const visibleCards = useVisibleCardCount()
  const quote = useQuote(appliedCoupon)
  const updateQuantity = useUpdateCartQuantity()
  const removeItem = useRemoveCartItem()

  const items = cart.data ?? []
  const inCart = new Set(items.map((item) => item.nftId))
  const related = (useNftList({ pageSize: 20, sort: 'featured' }).data?.data ?? [])
    .filter((nft) => !inCart.has(nft.id))
    .map(toCatalogNft)
  const relatedPages = Math.max(1, Math.ceil(related.length / visibleCards))
  const visibleRelated = related.slice(relatedPage * visibleCards, (relatedPage + 1) * visibleCards)

  const couponStatus = appliedCoupon
    ? quote.isError
      ? 'error'
      : quote.isFetching
        ? 'idle'
        : 'applied'
    : 'idle'

  const anyUnavailable = items.some((item) => !item.nft.isAvailable)
  const canCheckout = authenticated && items.length > 0 && !quote.isFetching && !quote.isError && !anyUnavailable

  const handleFinalize = () => {
    if (canCheckout) onCheckout()
  }

  return (
    <main className="mx-auto max-w-[1248px] px-7 py-8 sm:px-6">
      <div className="hidden lg:block">
        <Breadcrumb
          items={[{ label: 'Início', to: '/' }, { label: 'Mercado', to: '/' }, { label: 'Carrinho' }]}
        />
      </div>
      {/* Mobile / Carrinho: 44px screen header with the back control and a 20px title. */}
      <div className="flex h-11 items-center gap-[61px] lg:hidden">
        <Link
          to="/"
          aria-label="Voltar para o mercado"
          className="text-canvas grid size-[35px] place-items-center rounded-full border border-white/10"
        >
          <ChevronLeftIcon aria-hidden className="size-5" />
        </Link>
        <span aria-hidden className="text-canvas text-xl leading-4 font-bold">
          Carrinho de NFTs
        </span>
      </div>
      <h1 className="sr-only">Carrinho de NFTs</h1>
      {/* Figma `Cart Body`: 782px table, 86px gutter and a 332px wallet summary. */}
      <div className="mt-3 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[1fr_332px] lg:gap-[86px]">
        <section aria-label="Itens do carrinho">
          {cart.isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((n) => (
                <Skeleton key={n} className="h-20 w-full" label="Carregando item do carrinho" />
              ))}
            </div>
          ) : cart.isError ? (
            <ErrorState message="Não foi possível carregar seu carrinho." onRetry={() => cart.refetch()} />
          ) : items.length === 0 ? (
            <EmptyState
              title="Seu carrinho está vazio"
              description="Explore o mercado e adicione NFTs para vê-los aqui."
              actionLabel="Explorar o mercado"
              onAction={onExplore}
            />
          ) : (
            <div>
              <div className="text-canvas border-primary hidden grid-cols-[250px_77px_75px_87px_24px] items-center justify-between border-b pb-3 text-base leading-4 md:grid md:pr-6">
                <span className="font-bold">NFTs</span>
                <span className="font-medium">Preço</span>
                <span className="font-bold">Edições</span>
                <span className="font-medium">Total</span>
                <span className="w-7" aria-hidden />
              </div>
              <div className="mt-3 space-y-5 lg:space-y-3">
              {items.map((item) => (
                <CartItemRow
                  key={item.nftId}
                  image={item.nft.imageUrl}
                  title={item.nft.title}
                  tokenId={item.nft.id}
                  priceEth={item.price}
                  lineTotalEth={item.total}
                  quantity={item.quantity}
                  max={cartLineMax(item)}
                  onQuantityChange={(quantity) => updateQuantity.mutate({ nftId: item.nftId, quantity })}
                  onRemove={() => removeItem.mutate(item.nftId)}
                />
              ))}
              </div>
            </div>
          )}
        </section>

        <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          {/* Mobile draws the summary as a full-bleed #241612 band, 24px in and 36px at the bottom. */}
          <div className="-mx-7 bg-surface-card px-6 pt-6 pb-9 lg:mx-0 lg:bg-transparent lg:p-0">
            <h2 className="text-canvas border-primary mb-6 hidden border-b pb-3 text-lg leading-4 font-bold lg:block">
              Resumo da carteira
            </h2>
            <CouponField
              value={couponInput}
              onChange={setCouponInput}
              onApply={() => setAppliedCoupon(couponInput.trim() || undefined)}
              status={couponStatus}
              message={quote.isError ? 'Cupom inválido ou expirado.' : undefined}
              className="mb-6"
              appliedCode={couponStatus === 'applied' ? appliedCoupon : undefined}
              onRemove={() => {
                setAppliedCoupon(undefined)
                setCouponInput('')
              }}
            />
          </div>

          <OrderSummary
            loading={quote.isLoading}
            updating={quote.isFetching && !quote.isLoading}
            subtotalEth={quote.data?.subtotal ?? '0'}
            discountEth={quote.data?.discount ?? '0'}
            networkFeeEth={quote.data?.networkFee ?? '0'}
            totalEth={quote.data?.total ?? '0'}
          />

          <div className="mt-6">
            <Button
              className="h-[60px] w-full rounded-[40px] text-[16px] font-bold sm:h-10 sm:rounded-[3px] sm:text-[15px]"
              disabled={!canCheckout}
              onClick={handleFinalize}
            >
              Conectar e finalizar
            </Button>
            <button
              type="button"
              onClick={onExplore}
              className="text-highlight mx-auto mt-3 block text-[15px] leading-[19.8px] hover:underline"
            >
              Continuar explorando
            </button>
          </div>
        </aside>
      </div>

      {related.length > 0 ? (
        <section className="mt-12 lg:mt-24">
          <h2 className="text-highlight border-primary border-b pb-3 text-[17px] leading-4 font-bold">
            Colecionadores também viram
          </h2>
          <NftGrid items={visibleRelated} variant="compact" className="mt-8" />
          <CarouselDots
            count={relatedPages}
            index={relatedPage}
            onChange={setRelatedPage}
            label="Colecionadores também viram"
            className="mt-8 justify-center"
          />
        </section>
      ) : null}
    </main>
  )
}
