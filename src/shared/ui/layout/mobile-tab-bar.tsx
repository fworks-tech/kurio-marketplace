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

/**
 * Figma `Mobile / Início` tab bar: 95px bar with 20px outline icons at 40px from
 * the top and a 65px floating action that overlaps the bar by 31px. Labels are
 * screen-reader only, matching the icon-only bar in the design.
 */
function TabLabel({ children }: { children: string }) {
  return <span className="sr-only">{children}</span>
}

export function MobileTabBar({ active, className }: MobileTabBarProps) {
  const itemClass = (key: TabKey) =>
    cn(
      'flex flex-col items-center justify-center gap-0.5',
      active === key ? 'text-highlight' : 'text-[#CFB28C]'
    )

  return (
    <nav
      aria-label="Navegação inferior"
      className={cn(
        'shadow-tab-up fixed inset-x-0 bottom-0 z-40 grid h-[95px] grid-cols-5 items-center bg-[#241612] px-4 pt-6 pb-[calc(0.75rem+env(safe-area-inset-bottom))]',
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
        <span className="bg-gradient-fab pointer-events-none absolute -top-[31px] left-1/2 flex size-[65px] -translate-x-1/2 items-center justify-center rounded-full text-white shadow-glow">
          <PlusIcon aria-hidden className="size-6" />
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
