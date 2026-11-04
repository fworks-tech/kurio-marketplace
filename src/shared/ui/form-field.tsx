import { useId, type ReactNode } from 'react'
import { Label } from '@/components/ui/label'

interface FormFieldState {
  id: string
  describedBy?: string
  invalid: boolean
}

interface FormFieldProps {
  label: string
  hint?: string
  error?: string
  required?: boolean
  children: (state: FormFieldState) => ReactNode
}

/** Connects a label, hint and error to its control through ids and ARIA. */
export function FormField({ label, hint, error, required, children }: FormFieldProps) {
  const id = useId()
  const describedBy =
    [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') ||
    undefined

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {required ? (
          <span aria-hidden className="text-error">
            {' '}
            *
          </span>
        ) : null}
      </Label>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {hint && !error ? (
        <p id={`${id}-hint`} className="text-text-secondary text-xs">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-error text-xs">
          {error}
        </p>
      ) : null}
    </div>
  )
}
