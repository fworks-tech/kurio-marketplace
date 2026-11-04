import { RefreshCwIcon, UnplugIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type RealtimeStatus = 'online' | 'offline' | 'reconnecting'

interface ConnectionBannerProps {
  status: RealtimeStatus
  onReconnect?: () => void
  className?: string
}

/** Realtime connection banner; reconciliation is triggered through the caller. */
export function ConnectionBanner({ status, onReconnect, className }: ConnectionBannerProps) {
  if (status === 'online') return null

  const reconnecting = status === 'reconnecting'

  return (
    <div
      role={reconnecting ? 'status' : 'alert'}
      aria-live={reconnecting ? 'polite' : 'assertive'}
      className={cn(
        'border-border bg-surface-raised flex items-center justify-between gap-3 border-b px-4 py-2 text-sm',
        className
      )}
    >
      <span className="flex items-center gap-2">
        {reconnecting ? (
          <RefreshCwIcon aria-hidden className="text-highlight size-4 animate-spin" />
        ) : (
          <UnplugIcon aria-hidden className="text-error size-4" />
        )}
        {reconnecting ? 'Reconectando à tempo real…' : 'Sem conexão em tempo real.'}
      </span>
      {!reconnecting && onReconnect ? (
        <Button variant="outline" size="sm" onClick={onReconnect}>
          Reconectar
        </Button>
      ) : null}
    </div>
  )
}
