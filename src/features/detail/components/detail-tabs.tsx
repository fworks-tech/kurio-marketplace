import type { ReactNode } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

export interface DetailTab {
  value: string
  label: string
  content: ReactNode
}

interface DetailTabsProps {
  tabs: DetailTab[]
  value: string
  onChange: (value: string) => void
  className?: string
}

export function DetailTabs({ tabs, value, onChange, className }: DetailTabsProps) {
  return (
    <Tabs value={value} onValueChange={onChange} className={cn('w-full', className)}>
      <TabsList variant="line" className="gap-6 bg-transparent px-0">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="pt-4">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  )
}
