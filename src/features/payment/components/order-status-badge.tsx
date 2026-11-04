import { CheckIcon, ClockIcon, XIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { OrderStatus } from '@/shared/api/api-types'

type Config = {
  label: string
  variant: 'default' | 'secondary' | 'destructive'
  icon: typeof CheckIcon
}

const CONFIG: Record<OrderStatus, Config> = {
  pending: { label: 'Pendente', variant: 'secondary', icon: ClockIcon },
  confirmed: { label: 'Confirmado', variant: 'default', icon: CheckIcon },
  completed: { label: 'Concluído', variant: 'default', icon: CheckIcon },
  rejected: { label: 'Recusado', variant: 'destructive', icon: XIcon }
}

/** Status is carried by text + icon, never color alone. */
export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = CONFIG[status]
  const Icon = config.icon
  return (
    <Badge variant={config.variant}>
      <Icon aria-hidden className="size-3" />
      {config.label}
    </Badge>
  )
}
