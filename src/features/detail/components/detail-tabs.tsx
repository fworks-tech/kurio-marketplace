import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
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

/**
 * Figma `Frame 178`: trilha de 28px com as abas, régua de 0,3px em #D28A4C na
 * largura toda e sublinhado de 3px sob a aba ativa. Controle próprio (sem o
 * primitivo do design system) para manter exatamente essas medidas.
 */
export function DetailTabs({ tabs, value, onChange, className }: DetailTabsProps) {
  const baseId = useId()
  const listRef = useRef<HTMLDivElement>(null)
  const active = tabs.find((tab) => tab.value === value) ?? tabs[0]

  const move = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    if (!step) return
    event.preventDefault()
    const next = (index + step + tabs.length) % tabs.length
    onChange(tabs[next]!.value)
    listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus()
  }

  return (
    <div className={cn('w-full', className)}>
      <div
        ref={listRef}
        role="tablist"
        aria-label="Detalhes do NFT"
        className="border-primary/30 flex w-full items-center gap-8 border-b-[0.3px]"
      >
        {tabs.map((tab, index) => {
          const selected = tab.value === active?.value
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              id={`${baseId}-tab-${tab.value}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${tab.value}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(tab.value)}
              onKeyDown={(event) => move(event, index)}
              className={cn(
                'h-[28px] text-[17px] leading-4 whitespace-nowrap transition-colors',
                selected
                  ? 'border-primary text-highlight border-b-[3px] font-bold'
                  : 'text-canvas hover:text-highlight font-normal'
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.value}
          role="tabpanel"
          id={`${baseId}-panel-${tab.value}`}
          aria-labelledby={`${baseId}-tab-${tab.value}`}
          hidden={tab.value !== active?.value}
          className="pt-3"
        >
          {tab.value === active?.value ? tab.content : null}
        </div>
      ))}
    </div>
  )
}
