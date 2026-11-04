import { Link } from '@tanstack/react-router'
import { ExternalLinkIcon } from 'lucide-react'
import { Breadcrumb } from '@/shared/ui/breadcrumb'
import { ErrorState } from '@/shared/ui/error-state'
import { Skeleton } from '@/shared/ui/skeleton'
import { PriceDisplay } from '@/shared/ui/price-display'
import { formatPrice } from '@/shared/lib/format'
import { Button } from '@/components/ui/button'
import { OrderStatusBadge } from './components/order-status-badge'
import { OrderSummary } from './components/order-summary'
import type { OrderSummary as Order } from '@/shared/api/api-types'

interface OrderConfirmationViewProps {
  orderId: string
  order?: Order
  loading: boolean
  error: boolean
  onRetry: () => void
}

/** The API `OrderSummary` is structurally a superset of this view model, so it can be passed directly. */
export function OrderConfirmationView({
  orderId,
  order,
  loading,
  error,
  onRetry
}: OrderConfirmationViewProps) {
  return (
    <main className="mx-auto max-w-[1000px] px-4 py-8 sm:px-6">
      <Breadcrumb items={[{ label: 'Início', to: '/' }, { label: 'Pedido', to: `/orders/${orderId}` }]} />

      {loading ? (
        <div className="mt-6 space-y-4">
          <Skeleton className="h-8 w-1/2" label="Carregando pedido" />
          <Skeleton className="h-40 w-full" label="Carregando itens" />
        </div>
      ) : error || !order ? (
        <div className="mt-6">
          <ErrorState message="Não foi possível carregar este pedido." onRetry={onRetry} />
        </div>
      ) : (
        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
          <section className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">
                  {order.status === 'confirmed' || order.status === 'completed'
                    ? 'Compra realizada!'
                    : order.status === 'pending'
                      ? 'Pedido em processamento'
                      : 'Pedido recusado'}
                </h1>
                <OrderStatusBadge status={order.status} />
              </div>
              <p className="text-text-secondary text-sm">
                Pedido <span className="font-semibold">#{orderId}</span> · {order.buyer.username} (
                {order.buyer.address.slice(0, 6)}…{order.buyer.address.slice(-4)})
              </p>
            </div>

            <ul className="divide-white/10 space-y-0 divide-y">
              {order.items.map((item) => (
                <li key={item.nftId} className="flex items-center gap-3 py-3">
                  <img
                    src={item.nft.imageUrl}
                    alt=""
                    className="size-14 shrink-0 rounded-md border border-white/10 object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{item.nft.title}</p>
                    <p className="text-text-secondary text-xs">
                      {formatPrice(item.unitPrice)} × {item.quantity}
                    </p>
                  </div>
                  <PriceDisplay value={item.total} />
                </li>
              ))}
            </ul>

            {order.status === 'rejected' ? (
              <div className="border-coral/50 bg-coral/10 rounded-card border p-4" role="alert">
                <p className="text-coral font-semibold">O pagamento não foi aprovado</p>
                <p className="text-canvas/80 mt-1 text-sm">
                  A transação foi recusada pela rede e nada foi cobrado. Seus itens continuam no
                  carrinho, então você pode revisar o pedido e tentar de novo.
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <Link to="/payment">
                    <Button size="sm">Tentar novamente</Button>
                  </Link>
                  <Link to="/cart">
                    <Button size="sm" variant="outline">
                      Revisar carrinho
                    </Button>
                  </Link>
                </div>
              </div>
            ) : order.explorerUrl ? (
              <a
                href={order.explorerUrl}
                target="_blank"
                rel="noreferrer"
                className="text-highlight inline-flex items-center gap-1 text-sm font-semibold hover:underline"
              >
                Ver transação {order.transactionId ? `(${order.transactionId.slice(0, 10)}…)` : ''}
                <ExternalLinkIcon aria-hidden className="size-4" />
              </a>
            ) : (
              <p className="text-text-secondary text-sm">Transação na rede {order.network}.</p>
            )}
          </section>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <h2 className="border-highlight/40 mb-4 border-b pb-2 text-lg font-bold">Resumo</h2>
            <OrderSummary
              subtotalEth={order.subtotal}
              discountEth={Number(order.discount) > 0 ? order.discount : undefined}
              networkFeeEth={order.fee}
              totalEth={order.total}
            />
            <Link to="/" className="mt-6 block">
              <Button className="w-full" variant="outline">
                Continuar explorando
              </Button>
            </Link>
          </aside>
        </div>
      )}
    </main>
  )
}
