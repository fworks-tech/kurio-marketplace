import { XIcon } from 'lucide-react'
import { SearchIcon } from '@/shared/ui/icons'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface SearchFieldProps {
  value: string
  onChange: (value: string) => void
  onClear?: () => void
  label?: string
  placeholder?: string
  id?: string
  className?: string
}

/** Debounce is owned by the caller; this field stays fully controlled. */
export function SearchField({
  value,
  onChange,
  onClear,
  label = 'Buscar',
  placeholder,
  id = 'catalog-search',
  className
}: SearchFieldProps) {
  return (
    <div className={cn('relative', className)}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <SearchIcon
        aria-hidden
        className="text-text-secondary pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
      />
      <Input
        id={id}
        type="search"
        role="searchbox"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="pl-9 pr-9"
      />
      {value ? (
        <button
          type="button"
          aria-label="Limpar busca"
          onClick={onClear ?? (() => onChange(''))}
          className="text-text-secondary hover:text-text absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1"
        >
          <XIcon aria-hidden className="size-4" />
        </button>
      ) : null}
    </div>
  )
}
