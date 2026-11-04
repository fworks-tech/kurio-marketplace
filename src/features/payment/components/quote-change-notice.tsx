import { TriangleAlertIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface QuoteChangeNoticeProps {
  changes: string[]
  onConfirm: () => void
  confirmLabel?: string
  className?: string
}

/** Requires an explicit confirmation before checkout continues; caller announces through the live region. */
export function QuoteChangeNotice({
  changes,
  onConfirm,
  confirmLabel = 'Entendi, continuar',
  className
}: QuoteChangeNoticeProps) {
  if (changes.length === 0) return null

  return (
    <div
      role="alert"
      className={cn('border-highlight/50 bg-highlight/10 space-y-3 rounded-card border p-4', className)}
    >
      <p className="flex items-center gap-2 font-semibold">
        <TriangleAlertIcon aria-hidden className="text-highlight size-5" />
        O orçamento mudou
      </p>
      <ul className="text-text-secondary list-disc space-y-1 pl-5 text-sm">
        {changes.map((change) => (
          <li key={change}>{change}</li>
        ))}
      </ul>
      <Button size="sm" onClick={onConfirm}>
        {confirmLabel}
      </Button>
    </div>
  )
}
