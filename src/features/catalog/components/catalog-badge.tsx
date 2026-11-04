import { Badge } from '@/components/ui/badge'
import type { CatalogBadgeKind } from '../catalog-types'

const LABELS: Record<CatalogBadgeKind, string> = {
  raro: 'RARO',
  'oferta-limitada': 'OFERTA LIMITADA',
  destaque: 'EM DESTAQUE'
}

const VARIANTS: Record<CatalogBadgeKind, 'default' | 'secondary' | 'destructive'> = {
  raro: 'secondary',
  'oferta-limitada': 'destructive',
  destaque: 'default'
}

export function CatalogBadge({ kind }: { kind: CatalogBadgeKind }) {
  return <Badge variant={VARIANTS[kind]}>{LABELS[kind]}</Badge>
}
