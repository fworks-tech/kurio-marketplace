import { createFileRoute } from '@tanstack/react-router'
import { requireSession } from '@/app/auth-guard'
import { OrderConfirmationView } from '@/features/payment/order-confirmation-screen'
import { useOrder } from '@/features/payment/payment-queries'

export const Route = createFileRoute('/orders/$orderId')({
  beforeLoad: ({ context, params }) =>
    requireSession(context.queryClient, `/orders/${params.orderId}`),
  component: OrderConfirmationRoute
})

function OrderConfirmationRoute() {
  const { orderId } = Route.useParams()
  const order = useOrder(orderId)
  return (
    <OrderConfirmationView
      orderId={orderId}
      order={order.data}
      loading={order.isLoading}
      error={order.isError}
      onRetry={() => order.refetch()}
    />
  )
}
