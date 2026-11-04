import { AlertCircleIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorStateProps {
  message: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({ message, onRetry, className }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={
        className
          ? `flex flex-col items-center justify-center gap-3 rounded-xl border border-error/40 bg-error/5 p-10 text-center ${className}`
          : 'flex flex-col items-center justify-center gap-3 rounded-xl border border-error/40 bg-error/5 p-10 text-center'
      }
    >
      <AlertCircleIcon aria-hidden className="size-8 text-error" />
      <p className="font-semibold text-error">{message}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Tentar novamente
        </Button>
      ) : null}
    </div>
  )
}
