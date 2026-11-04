import { MoreVerticalIcon } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { shortAddress, truncateMiddle } from '@/shared/lib/format'
import type { Wallet } from '@/shared/api/api-types'

function displayAddress(address: string): string {
  return address.includes('.') ? truncateMiddle(address, 10, 4) : shortAddress(address)
}

interface WalletCardProps {
  wallet: Wallet
  selected: boolean
  onSelect: (id: string) => void
  onRemove?: (id: string) => void
  className?: string
}

/** Selectable wallet row; the overflow menu only appears when a real action exists. */
export function WalletCard({ wallet, selected, onSelect, onRemove, className }: WalletCardProps) {
  return (
    <div
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onClick={() => onSelect(wallet.id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect(wallet.id)
        }
      }}
      className={cn(
        'flex items-center gap-3 rounded-md border px-3 py-2',
        selected ? 'border-primary bg-surface-card' : 'border-white/15 hover:border-white/30',
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          'grid size-4 shrink-0 place-items-center rounded-full border',
          selected ? 'border-primary bg-primary' : 'border-white/40'
        )}
      >
        {selected ? <span className="size-1.5 rounded-full bg-white" /> : null}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">
          {wallet.label}
          {wallet.isPrimary ? <span className="text-text-secondary font-normal"> · principal</span> : null}
        </p>
        <p className="text-text-secondary truncate text-xs">
          {displayAddress(wallet.address)} · {wallet.network}
        </p>
      </div>

      {onRemove ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={`Ações da carteira ${wallet.label}`}
            className="text-text-secondary hover:text-text rounded-md p-1"
          >
            <MoreVerticalIcon aria-hidden className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem variant="destructive" onSelect={() => onRemove(wallet.id)}>
              Remover
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  )
}
