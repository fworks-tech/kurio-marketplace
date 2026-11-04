import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { requireSession } from '@/app/auth-guard'
import { PaymentScreen } from '@/features/payment/payment-screen'

export const Route = createFileRoute('/payment')({
  beforeLoad: ({ context }) => requireSession(context.queryClient, '/payment'),
  component: PaymentRoute
})

function PaymentRoute() {
  const navigate = useNavigate()
  return (
    <PaymentScreen
      onPlaced={(orderId) => navigate({ to: '/orders/$orderId', params: { orderId } })}
    />
  )
}
