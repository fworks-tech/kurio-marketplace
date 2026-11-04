import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import type { CatalogOption } from '../catalog-types'

interface CatalogTabsProps {
  value: string
  options: CatalogOption[]
  onChange: (value: string) => void
  className?: string
}

/** Tablist semantics come from the Radix Tabs primitive; content is owned by the screen. */
export function CatalogTabs({ value, options, onChange, className }: CatalogTabsProps) {
  return (
    <Tabs value={value} onValueChange={onChange} className={cn(className)}>
      <TabsList
        variant="line"
        className="h-auto flex-nowrap gap-x-1 gap-y-0 bg-transparent p-0 lg:flex-wrap lg:gap-x-5 lg:gap-y-2 [&>*:last-child]:ml-3 lg:[&>*:last-child]:ml-0"
      >
        {options.map((option) => {
          const active = value === option.value
          return (
            <TabsTrigger
              key={option.value}
              value={option.value}
              className={cn(
                'text-canvas! relative h-4 gap-0 p-0 text-sm leading-4 font-normal whitespace-nowrap',
                'data-[state=active]:text-highlight! data-[state=active]:font-bold lg:text-[15px] lg:font-medium'
              )}
            >
              {option.label}
              {/* Figma Toolbar/Tabs: linha de 2px em #D28A4C, 4px abaixo do texto. */}
              <span
                aria-hidden
                className={cn(
                  'absolute inset-x-0 -bottom-[6px] h-0.5',
                  active ? 'bg-primary' : 'bg-transparent'
                )}
              />
            </TabsTrigger>
          )
        })}
      </TabsList>
      {/* The grid below is the real panel; these keep each trigger's aria-controls valid. */}
      {options.map((option) => (
        <TabsContent key={option.value} value={option.value} forceMount className="hidden" />
      ))}
    </Tabs>
  )
}
