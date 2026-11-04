export type CatalogBadgeKind = 'raro' | 'oferta-limitada' | 'destaque'

export interface CatalogNft {
  id: string
  title: string
  imageUrl: string
  priceEth: string
  collection?: string
  badges?: CatalogBadgeKind[]
  previousPriceEth?: string
  isFavorite?: boolean
  isAvailable?: boolean
}

export interface CatalogFacetOption {
  value: string
  label: string
  count: number
}

export interface CatalogFacets {
  collections: CatalogFacetOption[]
  networks: CatalogFacetOption[]
}

export interface CatalogFilterValues {
  search: string
  collection?: string
  network?: string
  minPrice?: number
  maxPrice?: number
}

export interface CatalogOption {
  value: string
  label: string
}

export type CatalogTab = CatalogOption
