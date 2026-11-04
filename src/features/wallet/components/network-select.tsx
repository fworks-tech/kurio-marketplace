import { useId } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { CatalogOption } from '@/features/catalog/catalog-types'

interface NetworkSelectProps {
  value: string
  options: CatalogOption[]
  onChange: (value: string) => void
  label?: string
  error?: string
  className?: string
}

/** Validation against the selected wallet is owned by the caller; the error is just rendered. */
export function NetworkSelect({
  value,
  options,
  onChange,
  label = 'Rede',
  error,
  className
}: NetworkSelectProps) {
  const id = useId()
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          id={id}
          className="w-full"
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? `${id}-error` : undefined}
        >
          <SelectValue placeholder="Selecione a rede" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-error text-xs">
          {error}
        </p>
      ) : null}
    </div>
  )
}
