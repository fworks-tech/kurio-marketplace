import { useId, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface AccountFieldState {
  id: string
  describedBy?: string
  invalid: boolean
}

interface AccountFieldProps {
  label?: string
  required?: boolean
  hint?: string
  error?: string
  /** Extra content rendered beside the label, right aligned (e.g. `Adicionar`) */
  action?: ReactNode
  className?: string
  children: (state: AccountFieldState) => ReactNode
}

/**
 * Field shell for the account screens (Figma `Perfil do Colecionador` /
 * `Carteiras`): 15px label, optional coral required marker, 10px gap to a 40px
 * control. Kept local to `features/account` because the auth screens use the
 * larger 50px variant of `FormField`.
 */
export function AccountField({
  label,
  required,
  hint,
  error,
  action,
  className,
  children
}: AccountFieldProps) {
  const id = useId()
  const describedBy =
    [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') || undefined

  return (
    <div className={cn('flex min-w-0 flex-col gap-2.5', className)}>
      {(label ?? action) ? (
        <div className="flex h-[29px] items-center justify-between gap-4">
          {label ? (
            <label
              htmlFor={id}
              className="text-text flex items-center gap-1 text-[15px] leading-[15px] font-normal"
            >
              {label}
              {required ? (
                <span aria-hidden className="text-coral text-[22px] leading-none">
                  *
                </span>
              ) : null}
            </label>
          ) : (
            <span />
          )}
          {action}
        </div>
      ) : null}
      {children({ id, describedBy, invalid: Boolean(error) })}
      {hint && !error ? (
        <p id={`${id}-hint`} className="text-sand text-[13px] leading-[18px]">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-error text-[13px] leading-[18px]">
          {error}
        </p>
      ) : null}
    </div>
  )
}

/** Shared visual contract for every input on the account screens. */
export const accountInputClass =
  'h-10 w-full rounded-field border-field bg-transparent px-[13px] text-[15px] leading-[22px] text-text placeholder:text-[14px] placeholder:text-sand'
