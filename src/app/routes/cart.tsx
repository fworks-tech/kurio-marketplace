import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { RequireAuth } from '@/shared/ui/require-auth'
import { CartScreen } from '@/features/cart/cart-screen'
import { useSession } from '@/features/session/session-queries'

export const Route = createFileRoute('/cart')({
  component: CartRoute
})

function CartRoute() {
  const { data: session, isLoading } = useSession()
  const navigate = useNavigate()
  return (
    <RequireAuth loading={isLoading} authenticated={Boolean(session)} landmark>
      <CartScreen
        authenticated={Boolean(session)}
        onCheckout={() => navigate({ to: '/payment' })}
        onExplore={() => navigate({ to: '/' })}
      />
    </RequireAuth>
  )
}
