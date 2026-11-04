import type { ReactNode } from 'react'
import { ArrowLeftIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface MobileScreenHeaderProps {
  title: string
  onBack?: () => void
  actions?: ReactNode
  className?: string
}

export function MobileScreenHeader({
  title,
  onBack,
  actions,
  className
}: MobileScreenHeaderProps) {
  const handleBack = onBack ?? (() => window.history.back())

  return (
    <header
      className={cn(
        'border-border bg-ink sticky top-0 z-30 flex items-center gap-2 border-b px-2 py-3',
        className
      )}
    >
      <Button variant="ghost" size="icon" aria-label="Voltar" onClick={handleBack}>
        <ArrowLeftIcon className="size-5" />
      </Button>
      <h1 className="min-w-0 flex-1 truncate text-center text-base font-bold">{title}</h1>
      <div className="flex min-w-9 items-center justify-end">{actions}</div>
    </header>
  )
}
