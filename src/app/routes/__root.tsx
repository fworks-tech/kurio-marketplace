import { Outlet, Link, createRootRouteWithContext, useRouterState } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { SiteHeader } from '@/shared/ui/layout/site-header'
import { SiteFooter } from '@/shared/ui/layout/site-footer'
import { MobileTabBar } from '@/shared/ui/layout/mobile-tab-bar'
import { AuthDialogProvider } from '@/features/auth/auth-dialog'
import { useSession } from '@/features/session/session-queries'
import { endSession } from '@/features/session/session-actions'
import { useCart } from '@/features/cart/cart-queries'
import { useGuestCartCount, useMergeGuestCart } from '@/features/cart/use-guest-cart'

interface RouterContext {
  queryClient: QueryClient
}

type MobileTab = 'inicio' | 'favoritos' | 'carrinho' | 'perfil'

function activeTab(pathname: string): MobileTab {
  if (pathname.startsWith('/cart')) return 'carrinho'
  if (pathname.startsWith('/favorites')) return 'favoritos'
  if (/^\/(profile|wallets|orders)/.test(pathname)) return 'perfil'
  return 'inicio'
}

// Market-flow screens (detail, cart, payment, order) use a bare header; the
// home, auth, profile and wallets screens show the hairline divider under it.
function headerChrome(pathname: string): { active: 'mercado' | 'inicio'; divider: boolean } {
  const market = /^\/(nfts\/|cart|payment|orders\/)/.test(pathname)
  return { active: market ? 'mercado' : 'inicio', divider: !market }
}

function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-bold">Página não encontrada</h1>
      <p className="text-text-secondary text-sm">O endereço acessado não existe neste marketplace.</p>
      <Link to="/" className="rounded-pill bg-primary px-4 py-2 text-sm font-semibold text-white">
        Voltar ao mercado
      </Link>
    </main>
  )
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFound
})

function RootLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const { data: session } = useSession()
  const cart = useCart()
  const guestCount = useGuestCartCount()
  useMergeGuestCart()
  const chrome = headerChrome(pathname)
  const hideFooter = /^\/(profile|wallets)(\/|$)/.test(pathname)

  return (
    <AuthDialogProvider>
      <div className="bg-bg text-text flex min-h-dvh flex-col pt-6">
        <SiteHeader
          isAuthenticated={Boolean(session)}
          cartCount={(session ? (cart.data?.length ?? 0) : 0) + guestCount}
          accountLabel={session?.user.username ?? 'Conta'}
          active={chrome.active}
          divider={chrome.divider}
          onSignOut={() => void endSession()}
        />
        <div className="flex-1 pb-20 md:pb-0">
          <Outlet />
        </div>
        {/* The account frames (Perfil do Colecionador, Carteiras) have no footer. */}
        {hideFooter ? null : <SiteFooter />}
        <MobileTabBar active={activeTab(pathname)} className="md:hidden" />
      </div>
    </AuthDialogProvider>
  )
}
