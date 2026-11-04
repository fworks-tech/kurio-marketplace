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

/**
 * Figma `Promo Code`: a 14/16 bold label, then a 40px field with the orange
 * "Aplicar" button embedded on its right edge.
 */
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

  return (
    <div className={cn('space-y-2', className)}>
      <label htmlFor={id} className="text-canvas block text-sm leading-4 font-bold">
        Código promocional
      </label>

      {status === 'applied' && appliedCode ? (
        <div className="border-success/40 bg-success/5 flex h-10 items-center justify-between gap-2 rounded-[3px] border pr-1 pl-3">
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
      ) : (
        <div className="relative">
          <Input
            id={id}
            value={value}
            placeholder="Digite o código promocional..."
            aria-invalid={status === 'error' || undefined}
            aria-describedby={status === 'error' ? errorId : undefined}
            onChange={(event) => onChange(event.target.value)}
            className="border-primary placeholder:text-sand placeholder:text-xs text-canvas h-10 pr-[102px] pl-2 text-xs"
          />
          <Button
            type="submit"
            onClick={onApply}
            className="text-ink absolute top-0 right-0 h-10 w-[102px] rounded-r-[3px] rounded-l-none text-[15px] font-bold"
          >
            Aplicar
          </Button>
        </div>
      )}

      {status === 'error' && message ? (
        <p id={errorId} role="alert" className="text-error text-xs">
          {message}
        </p>
      ) : null}
    </div>
  )
}
