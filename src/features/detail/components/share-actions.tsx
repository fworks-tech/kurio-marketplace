import { Link2Icon, Share2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ShareActionsProps {
  onCopyLink?: () => void
  className?: string
}

const UNAVAILABLE = ['X', 'Facebook', 'WhatsApp']

/** Only working actions are offered; out-of-scope sharing is disabled and stated, never fake-success. */
export function ShareActions({ onCopyLink, className }: ShareActionsProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {onCopyLink ? (
        <Button type="button" variant="outline" size="sm" onClick={onCopyLink}>
          <Link2Icon data-icon="inline-start" />
          Copiar link
        </Button>
      ) : null}
      {UNAVAILABLE.map((target) => (
        <Button key={target} type="button" variant="ghost" size="sm" disabled>
          <Share2Icon data-icon="inline-start" />
          {target}
          <span className="sr-only"> (não disponível nesta demo)</span>
        </Button>
      ))}
    </div>
  )
}
