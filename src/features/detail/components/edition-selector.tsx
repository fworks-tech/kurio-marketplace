import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'

export interface EditionOption {
  value: string
  label: string
  disabled?: boolean
  reason?: string
}

interface EditionSelectorProps {
  options: EditionOption[]
  value: string
  onSelect: (value: string) => void
  label?: string
  className?: string
}

/** Editions as a radio group; unavailable editions are disabled and explained by text. */
export function EditionSelector({
  options,
  value,
  onSelect,
  label = 'Edição',
  className
}: EditionSelectorProps) {
  const selected = options.find((option) => option.value === value)

  return (
    <fieldset className={cn('space-y-2', className)}>
      <legend className="text-sm font-medium">{label}</legend>
      <RadioGroup value={value} onValueChange={onSelect} className="flex flex-wrap gap-2">
        {options.map((option) => (
          <div key={option.value}>
            <RadioGroupItem
              id={`edition-${option.value}`}
              value={option.value}
              disabled={option.disabled}
              className="sr-only"
            />
            <label
              htmlFor={`edition-${option.value}`}
              className={cn(
                'rounded-pill inline-flex min-h-11 cursor-pointer items-center border px-4 text-sm font-medium',
                value === option.value
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-white/15 hover:text-text text-text-secondary',
                option.disabled && 'cursor-not-allowed opacity-50'
              )}
            >
              {option.label}
              {option.disabled && option.reason ? (
                <span className="sr-only"> — {option.reason}</span>
              ) : null}
            </label>
          </div>
        ))}
      </RadioGroup>
      {selected?.disabled && selected.reason ? (
        <p className="text-text-secondary text-xs">{selected.reason}</p>
      ) : null}
    </fieldset>
  )
}
