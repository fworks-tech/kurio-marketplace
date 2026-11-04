import { Link } from '@tanstack/react-router'
import {
  HeartIcon,
  HomeIcon,
  PlusIcon,
  ShoppingCartIcon,
  UserIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'

type TabKey = 'inicio' | 'favoritos' | 'carrinho' | 'perfil'

interface MobileTabBarProps {
  active: TabKey
  className?: string
}

function TabLabel({ children }: { children: string }) {
  return <span className="text-[11px]">{children}</span>
}

export function MobileTabBar({ active, className }: MobileTabBarProps) {
  const itemClass = (key: TabKey) =>
    cn(
      'flex flex-col items-center justify-center gap-0.5',
      active === key ? 'text-primary' : 'text-text-secondary'
    )

  return (
    <nav
      aria-label="Navegação inferior"
      className={cn(
        'border-border bg-ink/95 shadow-tab-up fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 items-center border-t px-2 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur',
        className
      )}
    >
      <Link to="/" aria-current={active === 'inicio' ? 'page' : undefined} className={itemClass('inicio')}>
        <HomeIcon aria-hidden className="size-5" />
        <TabLabel>Início</TabLabel>
      </Link>

      <button
        type="button"
        aria-current={active === 'favoritos' ? 'page' : undefined}
        aria-disabled="true"
        className={cn(itemClass('favoritos'), 'cursor-not-allowed')}
      >
        <HeartIcon aria-hidden className="size-5" />
        <TabLabel>Favoritos</TabLabel>
        <span className="sr-only"> (em breve)</span>
      </button>

      {/* FAB is decorative in this demo — the listing flow is out of scope. */}
      <span aria-hidden className="flex justify-center">
        <span className="bg-gradient-fab pointer-events-none -mt-6 flex size-14 items-center justify-center rounded-full text-white shadow-glow">
          <PlusIcon className="size-6" />
        </span>
      </span>

      <Link
        to="/cart"
        aria-current={active === 'carrinho' ? 'page' : undefined}
        className={itemClass('carrinho')}
      >
        <ShoppingCartIcon aria-hidden className="size-5" />
        <TabLabel>Carrinho</TabLabel>
      </Link>

      <Link
        to="/profile"
        aria-current={active === 'perfil' ? 'page' : undefined}
        className={itemClass('perfil')}
      >
        <UserIcon aria-hidden className="size-5" />
        <TabLabel>Perfil</TabLabel>
      </Link>
    </nav>
  )
}
