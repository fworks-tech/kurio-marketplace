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
      <TabsList variant="line" className="h-auto flex-wrap gap-x-5 gap-y-2 bg-transparent p-0">
        {options.map((option) => (
          <TabsTrigger
            key={option.value}
            value={option.value}
            className={cn(
              'text-canvas h-4 gap-0 p-0 text-[15px] leading-4 font-medium',
              'data-[state=active]:text-highlight',
              'after:bg-primary group-data-horizontal/tabs:after:bottom-[-6px] group-data-horizontal/tabs:after:h-0.5'
            )}
          >
            {option.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {/* The grid below is the real panel; these keep each trigger's aria-controls valid. */}
      {options.map((option) => (
        <TabsContent key={option.value} value={option.value} forceMount className="hidden" />
      ))}
    </Tabs>
  )
}
