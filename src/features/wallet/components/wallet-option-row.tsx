import { cn } from '@/lib/utils'

interface WalletOptionRowProps {
  id: string
  label: string
  selected: boolean
  onSelect: (id: string) => void
  mark?: React.ReactNode
  className?: string
}

/** Provider mark, label and radio — used inside a radiogroup by the wallet flow. */
export function WalletOptionRow({
  id,
  label,
  selected,
  onSelect,
  mark,
  className
}: WalletOptionRowProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={() => onSelect(id)}
      className={cn(
        'flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left',
        selected ? 'border-primary bg-surface-card' : 'border-white/15 hover:border-white/30',
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          'grid size-4 shrink-0 place-items-center rounded-full border',
          selected ? 'border-primary bg-primary' : 'border-white/40'
        )}
      >
        {selected ? <span className="size-1.5 rounded-full bg-white" /> : null}
      </span>
      {mark}
      <span className="text-sm font-medium">{label}</span>
    </button>
  )
}
