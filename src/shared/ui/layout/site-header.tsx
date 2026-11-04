import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { MenuIcon } from 'lucide-react'
import { CartIcon, LoginIcon, SearchIcon } from '@/shared/ui/icons'
import { Button } from '@/components/ui/button'
import { useAuthDialog } from '@/features/auth/auth-dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

type NavKey = 'inicio' | 'mercado' | 'criadores' | 'aprenda'

const NAV_ITEMS: ReadonlyArray<{ key: NavKey; label: string; to: '/' | null }> = [
  { key: 'inicio', label: 'Início', to: '/' },
  { key: 'mercado', label: 'Mercado', to: '/' },
  { key: 'criadores', label: 'Criadores', to: null },
  { key: 'aprenda', label: 'Aprenda', to: null }
]

interface SiteHeaderProps {
  isAuthenticated: boolean
  cartCount?: number
  accountLabel?: string
  active?: NavKey
  divider?: boolean
  onSignOut?: () => void
}

export function SiteHeader({
  isAuthenticated,
  cartCount = 0,
  accountLabel = 'Conta',
  active = 'inicio',
  divider = true,
  onSignOut
}: SiteHeaderProps) {
  const { openAuth } = useAuthDialog()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className={cn('bg-ink sticky top-0 z-40', divider && 'border-b-[0.3px] border-primary')}>
      <div className="mx-auto flex h-[45px] max-w-[1248px] items-start justify-between gap-4 px-4 sm:px-6">
        <Link
          to="/"
          data-brand
          className="text-canvas flex h-[45px] w-[160px] shrink-0 items-start pt-2 text-sm leading-[18px] font-bold tracking-[0.1em]"
        >
          KURIO
        </Link>

        <nav aria-label="Navegação principal" className="hidden items-stretch gap-10 md:flex">
          {NAV_ITEMS.map((item) => {
            const isActive = active === item.key
            const label = cn(
              'text-base leading-[21px] whitespace-nowrap',
              isActive ? 'text-highlight font-bold' : 'text-canvas font-normal hover:text-highlight',
              item.to === null && 'cursor-not-allowed'
            )
            return (
              <div key={item.key} className="flex h-[45px] flex-col items-start justify-between">
                {item.to ? (
                  <Link to={item.to} aria-current={isActive ? 'page' : undefined} className={label}>
                    {item.label}
                  </Link>
                ) : (
                  <span aria-disabled="true" className={label}>
                    {item.label}
                    <span className="sr-only"> (em breve)</span>
                  </span>
                )}
                <span
                  aria-hidden
                  className={cn('h-[3px] w-full self-stretch', isActive ? 'bg-primary' : 'bg-transparent')}
                />
              </div>
            )
          })}
        </nav>

        <div className="flex items-center gap-7">
          <button
            type="button"
            aria-label="Busca (em breve)"
            aria-disabled="true"
            className="text-canvas hidden cursor-not-allowed sm:block"
          >
            <SearchIcon aria-hidden className="size-5" />
          </button>

          <Link
            to="/cart"
            aria-label="Carrinho"
            className="text-canvas relative flex h-6 w-[31px] shrink-0 items-start"
          >
            <CartIcon aria-hidden className="size-6" />
            {cartCount > 0 ? (
              <span className="border-ink bg-primary text-ink absolute top-0 right-0 grid size-4 place-items-center rounded-full border-2 text-[10px] leading-none font-medium">
                {cartCount}
              </span>
            ) : null}
          </Link>

          {isAuthenticated ? (
            <div className="hidden items-center gap-3 sm:flex">
              <Link to="/profile" className="text-canvas text-sm font-semibold hover:text-highlight">
                {accountLabel}
              </Link>
              {onSignOut ? (
                <Button variant="ghost" size="sm" className="text-text-secondary" onClick={onSignOut}>
                  Sair
                </Button>
              ) : null}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openAuth('login')}
              className="bg-primary text-ink hidden h-[35px] w-[100px] cursor-pointer items-center justify-center gap-1 rounded-md text-base font-medium hover:brightness-105 sm:flex"
            >
              <LoginIcon aria-hidden className="size-5" />
              Entrar
            </button>
          )}

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-canvas md:hidden"
                aria-label="Abrir menu"
              >
                <MenuIcon className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(20rem,85vw)] gap-0">
              <SheetHeader>
                <SheetTitle>KURIO</SheetTitle>
              </SheetHeader>
              <nav aria-label="Navegação móvel" className="flex flex-col gap-4 p-6">
                {NAV_ITEMS.map((item) =>
                  item.to ? (
                    <Link key={item.key} to={item.to} className="text-canvas text-base font-medium">
                      {item.label}
                    </Link>
                  ) : (
                    <span key={item.key} aria-disabled="true" className="text-text-secondary cursor-not-allowed text-base">
                      {item.label}
                      <span className="sr-only"> (em breve)</span>
                    </span>
                  )
                )}
                {isAuthenticated ? (
                  onSignOut ? (
                    <Button variant="ghost" size="sm" className="justify-start" onClick={onSignOut}>
                      Sair
                    </Button>
                  ) : null
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false)
                      openAuth('login')
                    }}
                    className="text-highlight text-base font-medium"
                  >
                    Entrar
                  </button>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
