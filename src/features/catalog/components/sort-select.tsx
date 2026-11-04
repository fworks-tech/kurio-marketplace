import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { CatalogOption } from '../catalog-types'

interface SortSelectProps {
  value: string
  options: CatalogOption[]
  onChange: (value: string) => void
  label?: string
  id?: string
  className?: string
}

export function SortSelect({
  value,
  options,
  onChange,
  label = 'Ordenar por:',
  id = 'catalog-sort',
  className
}: SortSelectProps) {
  return (
    <div className={cn('flex w-[300px] items-center text-[15px] leading-[19.8px]', className)}>
      <span className="text-canvas w-[109px] shrink-0 whitespace-nowrap">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} aria-label={label} className="data-[size=default]:h-5 h-5 w-auto flex-1 justify-between gap-1 border-0 bg-transparent px-0 py-0 text-[15px] leading-[19.8px] font-normal shadow-none">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
