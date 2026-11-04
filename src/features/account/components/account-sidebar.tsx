import { Link } from '@tanstack/react-router'
import {
  ActivityIcon,
  AlertTriangleIcon,
  DownloadIcon,
  HeartIcon,
  LogOutIcon,
  MapPinIcon,
  ShoppingBagIcon,
  UserIcon
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

type AccountSection =
  | 'perfil'
  | 'carteiras'
  | 'atividade'
  | 'interesse'
  | 'ofertas'
  | 'arquivos'
  | 'suporte'

interface AccountItem {
  key: AccountSection
  label: string
  to?: '/profile' | '/wallets'
  icon: typeof UserIcon
}

const ITEMS: readonly AccountItem[] = [
  { key: 'perfil', label: 'Dados do perfil', to: '/profile', icon: UserIcon },
  { key: 'carteiras', label: 'Carteiras', to: '/wallets', icon: MapPinIcon },
  { key: 'atividade', label: 'Atividade', icon: ActivityIcon },
  { key: 'interesse', label: 'Lista de interesse', icon: HeartIcon },
  { key: 'ofertas', label: 'Ofertas', icon: ShoppingBagIcon },
  { key: 'arquivos', label: 'Arquivos baixados', icon: DownloadIcon },
  { key: 'suporte', label: 'Suporte', icon: AlertTriangleIcon }
]

interface AccountSidebarProps {
  active: AccountSection
  /** Kept for the component preview: notifies the caller of a navigation intent */
  onSelect?: (to: string) => void
  onSignOut?: () => void
  className?: string
}

/**
 * Account navigation shared by `Perfil do Colecionador` and `Carteiras`
 * (Figma `Account Sidebar`): 310px card, 45px rows, 6px active rail and the
 * divider + `Sair` action at the bottom.
 */
export function AccountSidebar({ active, onSelect, onSignOut, className }: AccountSidebarProps) {
  return (
    <nav aria-label="Seções da conta" className={cn('shrink-0', className)}>
      {/* Desktop rail */}
      <div className="bg-surface-card hidden w-[310px] py-2 lg:block">
        <div className="w-[129px] px-[10px] py-[10px]">
          <span className="text-text block text-[18px] leading-4 font-bold">Meu perfil</span>
        </div>

        <ul>
          {ITEMS.map((item) => {
            const isActive = item.key === active
            const Icon = item.icon
            const iconTone = isActive
              ? active === 'perfil'
                ? 'text-primary'
                : 'text-highlight'
              : item.key === 'perfil'
                ? 'text-text-secondary'
                : 'text-sand'
            const content = (
              <>
                <Icon aria-hidden strokeWidth={1.5} className={cn('size-[18px] shrink-0', iconTone)} />
                <span className="truncate">{item.label}</span>
              </>
            )

            return (
              <li key={item.key}>
                {item.to ? (
                  <Link
                    to={item.to}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'text-highlight flex h-[45px] items-center gap-3 px-4 text-[15px] leading-[22px] transition-colors',
                      isActive
                        ? 'border-primary gap-4 border-l-[6px] pl-[10px]'
                        : 'hover:bg-surface-raised/60 border-l-[6px] border-transparent'
                    )}
                  >
                    {content}
                  </Link>
                ) : (
                  <span
                    aria-disabled="true"
                    className="text-highlight/60 flex h-[45px] cursor-not-allowed items-center gap-3 border-l-[6px] border-transparent px-4 text-[15px] leading-[22px]"
                  >
                    {content}
                    <span className="sr-only"> (não disponível nesta versão)</span>
                  </span>
                )}
              </li>
            )
          })}
        </ul>

        <div role="presentation" className="border-primary border-t-[0.3px]" />

        <button
          type="button"
          onClick={onSignOut}
          className="text-highlight flex h-10 w-full items-center gap-2 px-4 text-[15px] leading-[15px] font-bold"
        >
          <LogOutIcon aria-hidden strokeWidth={1.5} className="text-primary size-5 shrink-0" />
          Sair
        </button>
      </div>

      {/* Mobile / tablet selector */}
      <div className="lg:hidden">
        <label htmlFor="account-section" className="sr-only">
          Seção da conta
        </label>
        <Select
          value={active}
          onValueChange={(next) => {
            const item = ITEMS.find((entry) => entry.key === next)
            if (item?.to && onSelect) onSelect(item.to)
          }}
        >
          <SelectTrigger id="account-section" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ITEMS.map((item) => (
              <SelectItem key={item.key} value={item.key} disabled={!item.to}>
                {item.label}
                {item.to ? null : ' (não disponível nesta versão)'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {onSignOut ? (
          <button
            type="button"
            onClick={onSignOut}
            className="text-highlight mt-2 flex h-10 items-center gap-2 text-[15px] font-bold"
          >
            <LogOutIcon aria-hidden strokeWidth={1.5} className="text-primary size-5" />
            Sair
          </button>
        ) : null}
      </div>
    </nav>
  )
}

/** Backwards-compatible alias used by the component preview. */
export const ProfileSidebar = AccountSidebar
