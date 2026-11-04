import { useId } from 'react'
import { CheckIcon, XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type CouponStatus = 'idle' | 'applied' | 'error'

interface CouponFieldProps {
  value: string
  onChange: (value: string) => void
  onApply: () => void
  status?: CouponStatus
  message?: string
  appliedCode?: string
  onRemove?: () => void
  className?: string
}

export function CouponField({
  value,
  onChange,
  onApply,
  status = 'idle',
  message,
  appliedCode,
  onRemove,
  className
}: CouponFieldProps) {
  const id = useId()
  const errorId = `${id}-error`

  if (status === 'applied' && appliedCode) {
    return (
      <div
        className={cn(
          'border-success/40 bg-success/5 flex items-center justify-between gap-2 rounded-md border px-3 py-2',
          className
        )}
      >
        <span className="flex items-center gap-2 text-sm">
          <CheckIcon aria-hidden className="text-success size-4" />
          Cupom <strong>{appliedCode}</strong> aplicado
        </span>
        {onRemove ? (
          <Button variant="ghost" size="sm" onClick={onRemove} aria-label="Remover cupom">
            <XIcon className="size-4" />
          </Button>
        ) : null}
      </div>
    )
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="sr-only">
        Cupom de desconto
      </label>
      <div className="flex gap-2">
        <Input
          id={id}
          value={value}
          placeholder="Digite o cupom"
          aria-invalid={status === 'error' || undefined}
          aria-describedby={status === 'error' ? errorId : undefined}
          onChange={(event) => onChange(event.target.value)}
        />
        <Button type="submit" variant="outline" onClick={onApply}>
          Aplicar
        </Button>
      </div>
      {status === 'error' && message ? (
        <p id={errorId} role="alert" className="text-error text-xs">
          {message}
        </p>
      ) : null}
    </div>
  )
}
