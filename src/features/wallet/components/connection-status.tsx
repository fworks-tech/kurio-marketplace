import { CircleCheckIcon, CircleXIcon, LoaderCircleIcon, UnplugIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type WalletConnectionStatus = 'idle' | 'connecting' | 'connected' | 'refused' | 'disconnected'

const TEXT: Record<WalletConnectionStatus, string> = {
  idle: 'Nenhuma carteira conectada.',
  connecting: 'Conectando…',
  connected: 'Carteira conectada.',
  refused: 'Conexão recusada na carteira.',
  disconnected: 'Carteira desconectada.'
}

interface ConnectionStatusProps {
  status: WalletConnectionStatus
  onRetry?: () => void
  className?: string
}

export function ConnectionStatus({ status, onRetry, className }: ConnectionStatusProps) {
  const canRetry = status === 'refused' || status === 'disconnected' || status === 'idle'

  return (
    <div className={cn('flex items-center justify-between gap-3 text-sm', className)}>
      <span className="flex items-center gap-2" role="status" aria-live="polite">
        {status === 'connecting' ? (
          <LoaderCircleIcon aria-hidden className="text-highlight size-4 animate-spin" />
        ) : status === 'connected' ? (
          <CircleCheckIcon aria-hidden className="text-success size-4" />
        ) : status === 'refused' ? (
          <CircleXIcon aria-hidden className="text-error size-4" />
        ) : (
          <UnplugIcon aria-hidden className="text-text-secondary size-4" />
        )}
        {TEXT[status]}
      </span>
      {canRetry && onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Tentar novamente
        </Button>
      ) : null}
    </div>
  )
}
