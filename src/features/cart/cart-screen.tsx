import { useState } from 'react'
import { Breadcrumb } from '@/shared/ui/breadcrumb'
import { EmptyState } from '@/shared/ui/empty-state'
import { ErrorState } from '@/shared/ui/error-state'
import { Skeleton } from '@/shared/ui/skeleton'
import { Button } from '@/components/ui/button'
import { CartItemRow } from './components/cart-item-row'
import { CouponField } from './components/coupon-field'
import { OrderSummary } from '@/features/payment/components/order-summary'
import { NftGrid } from '@/features/catalog/components/nft-grid'
import { toCatalogNft, useNftList } from '@/features/catalog/catalog-queries'
import { ApiError } from '@/shared/api/api-error'
import {
  cartLineMax,
  useCart,
  useQuote,
  useRemoveCartItem,
  useUpdateCartQuantity
} from './cart-queries'

interface CartScreenProps {
  authenticated: boolean
  onCheckout: () => void
  onExplore: () => void
}

export function CartScreen({ authenticated, onCheckout, onExplore }: CartScreenProps) {
  const cart = useCart()
  const [couponInput, setCouponInput] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<string | undefined>()
  const quote = useQuote(appliedCoupon)
  const updateQuantity = useUpdateCartQuantity()
  const removeItem = useRemoveCartItem()

  const items = cart.data ?? []
  const inCart = new Set(items.map((item) => item.nftId))
  const related = (useNftList({ pageSize: 6, sort: 'featured' }).data?.data ?? [])
    .filter((nft) => !inCart.has(nft.id))
    .slice(0, 4)
    .map(toCatalogNft)

  const quoteUnavailable = quote.isError && quote.error instanceof ApiError && quote.error.status === 422
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
    <main className="mx-auto max-w-[1248px] px-4 py-8 sm:px-6">
      <Breadcrumb items={[{ label: 'Início', to: '/' }, { label: 'Mercado', to: '/' }, { label: 'Carrinho' }]} />
      <h1 className="sr-only">Carrinho de NFTs</h1>
      <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_332px]">
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
              <div className="text-canvas border-primary hidden grid-cols-[minmax(0,1fr)_auto_auto_auto_auto] items-center gap-4 border-b pb-3 text-base md:grid">
                <span className="font-bold">NFTs</span>
                <span className="font-medium">Preço</span>
                <span className="font-bold">Edições</span>
                <span className="font-medium">Total</span>
                <span className="w-7" aria-hidden />
              </div>
              <div className="mt-3 space-y-3">
              {items.map((item) => (
                <CartItemRow
                  key={item.nftId}
                  image={item.nft.imageUrl}
                  title={item.nft.title}
                  tokenId={item.nft.id}
                  edition={`${item.nft.edition}/${item.nft.totalEdition}`}
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

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div>
            <h2 className="border-primary mb-3 border-b pb-2 text-lg font-bold">Resumo da carteira</h2>
            <CouponField
              value={couponInput}
              onChange={setCouponInput}
              onApply={() => setAppliedCoupon(couponInput.trim() || undefined)}
              status={couponStatus}
              message={quote.isError ? 'Cupom inválido ou expirado.' : undefined}
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
            discountEth={quote.data && Number(quote.data.discount) > 0 ? quote.data.discount : undefined}
            networkFeeEth={quote.data?.networkFee ?? '0'}
            totalEth={quote.data?.total ?? '0'}
          />

          <div className="space-y-3">
            <Button
              className="h-10 w-full rounded-[3px] text-[15px] font-bold"
              disabled={!canCheckout}
              onClick={handleFinalize}
            >
              Conectar e finalizar
            </Button>
            <button type="button" onClick={onExplore} className="text-highlight block text-sm font-semibold hover:underline">
              Continuar explorando
            </button>
          </div>
        </aside>
      </div>

      {related.length > 0 ? (
        <section className="mt-12">
          <h2 className="text-primary border-primary border-b pb-4 text-[17px] leading-4 font-bold">
            Colecionadores também viram
          </h2>
          <NftGrid items={related} variant="compact" />
        </section>
      ) : null}
    </main>
  )
}
