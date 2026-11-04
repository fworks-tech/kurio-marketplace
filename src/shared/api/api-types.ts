/**
 * Shared API response types for the NFT Marketplace.
 *
 * This file serves as the single source of truth for all API contract types.
 * All mock handlers, fixtures, and the HTTP client reference these types.
 *
 * @module shared/api
 * @see src/shared/api/api-error
 * @see src/mocks/handlers
 * @see src/mocks/state
 */

/** Root API response wrapper */
export interface ApiResponse<T> {
  data: T
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  success: boolean
  requestId: string
  timestamp: string
}

/** Supported catalog sort values */
export type NftSort =
  | 'price_asc'
  | 'price_desc'
  | 'name_asc'
  | 'name_desc'
  | 'featured'
  | 'newest'

/** Wallet networks accepted by the wallet API */
export type WalletNetwork =
  | 'Ethereum Mainnet'
  | 'Polygon'
  | 'Arbitrum'
  | 'Optimism'

/** Networks accepted by the quote and order APIs */
export type QuoteNetwork = 'ethereum' | 'polygon' | 'base'

/** Order lifecycle states */
export type OrderStatus = 'pending' | 'confirmed' | 'rejected' | 'completed'

/** Coupon discount kinds */
export type CouponDiscountType = 'percentage' | 'fixed'

/** A redeemable coupon */
export interface Coupon {
  code: string
  type: CouponDiscountType
  value: number
  expired?: boolean
}

/** Query parameters for the NFT catalog endpoint */
export interface NftListParams {
  page?: number
  pageSize?: number
  search?: string
  collection?: string
  minPrice?: string
  maxPrice?: string
  availability?: boolean
  featured?: boolean
  network?: string
  sort?: NftSort
}

/** Pagination parameters for API requests */
export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
  collectionId?: string
  minPrice?: string
  maxPrice?: string
}

/** Aggregate stats for an NFT */
export interface NftStats {
  viewCount: number
  bidCount: number
  floorPrice: string
}

/** NFT summary representation - used in list and catalog views */
export interface NftSummary {
  id: string
  title: string
  description: string
  imageUrl: string
  owner: string
  price: string
  royalty: number
  edition: number
  totalEdition: number
  isAvailable: boolean
  isFavorite: boolean
  createdAt: string
  updatedAt: string
  version?: number
  isFeatured?: boolean
  attributes?: NftAttribute[]
  collectionId?: string
  network?: string
  stats?: NftStats
}

/** A single facet option with its display label and item count */
export interface NftFacetOption {
  value: string
  label: string
  count: number
}

/** Catalog facets: collections, networks and catalog-wide price bounds (ETH strings) */
export interface NftFacets {
  collections: NftFacetOption[]
  networks: NftFacetOption[]
  minPrice: string
  maxPrice: string
}

/** Attribute for NFT metadata */
export interface NftAttribute {
  traitType: string
  value: string | number
}

/** Detailed NFT view - extends NftSummary with required stats */
export interface NftDetail extends NftSummary {
  stats: NftStats
}

/** User profile summary */
export interface UserSummary {
  id: string
  address: string
  username: string
  /** Collector-facing name shown in the profile form */
  displayName?: string
  /** Account e-mail (editable on the collector profile) */
  email?: string
  /** ENS suffix name, stored without the `.eth` suffix */
  ensName?: string
  avatar: string | null
  walletCount: number
  totalVolume: string
  isVerified: boolean
}

/** Connected wallet */
export interface Wallet {
  id: string
  address: string
  label: string
  network: string
  isPrimary: boolean
}

/** Error response from API - consistent error shape */
export interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
    field?: string
    fieldErrors?: Record<string, string[]>
    details?: unknown
    type: 'validation' | 'not_found' | 'unauthorized' | 'forbidden' | 'conflict' | 'server_error'
  }
  timestamp: string
  requestId: string
}

/** Authentication DTO for registration */
export interface RegisterDto {
  username: string
  email: string
  password: string
  walletAddress: string
}

/** Authentication DTO for login */
export interface LoginDto {
  email: string
  password: string
}

/** Request DTO for adding a cart item */
export interface AddCartItemDto {
  nftId: string
  quantity?: number
}

/** Request DTO for changing a cart item quantity */
export interface UpdateCartItemDto {
  quantity: number
}

/** Request DTO for generating a quote or revalidating an existing one */
export interface QuoteRequestDto {
  code?: string
  network?: QuoteNetwork
  quoteId?: string
}

/** Request DTO for creating an order */
export interface CreateOrderDto {
  code?: string
  network?: QuoteNetwork
}

/** Request DTO for updating the authenticated profile */
export interface UpdateProfileDto {
  username?: string
  displayName?: string
  email?: string
  ensName?: string
  avatar?: string | null
}

/** Request DTO for rotating the authenticated password */
export interface ChangePasswordDto {
  currentPassword: string
  newPassword: string
}

/** Request DTO for creating a wallet */
export interface CreateWalletDto {
  address: string
  label: string
  network: WalletNetwork
}

/** Request DTO for updating a wallet */
export interface UpdateWalletDto {
  label?: string
  network?: WalletNetwork
  isPrimary?: boolean
}

/** Auth session representation */
export interface AuthSession {
  user: UserSummary
  accessToken: string
  refreshToken: string
  expiresAt: string
}

/** Cart item representation */
export interface CartItem {
  nftId: string
  price: string
  quantity: number
  total: string
  nft: NftSummary
}

/** Favorite NFT marker */
export interface Favorite {
  id: string
  isFavorite: boolean
}

/** A priced line in a cart quote */
export interface QuoteItem {
  nftId: string
  version: number
  quantity: number
  unitPrice: string
  total: string
}

/** Cart quote with pricing, fees, and expiry */
export interface CartQuote {
  id: string
  items: QuoteItem[]
  subtotal: string
  discount: string
  discountType: 'percentage' | 'fixed' | null
  discountValue: number
  couponCode: string | null
  network: string
  networkFee: string
  total: string
  createdAt: string
  expiresAt: string
}

/** A priced line inside an order snapshot */
export interface OrderItem {
  nftId: string
  nft: NftSummary
  quantity: number
  unitPrice: string
  total: string
}

/** Order summary representation */
export interface OrderSummary {
  id: string
  status: OrderStatus
  version?: number
  price: string
  fee: string
  total: string
  items: OrderItem[]
  subtotal: string
  discount: string
  couponCode: string | null
  network: QuoteNetwork
  transactionId?: string
  explorerUrl?: string
  createdAt: string
  nft: NftSummary
  buyer: UserSummary
}

/** Collection summary */
export interface CollectionSummary {
  id: string
  name: string
  description: string
  imageUrl: string
  floorPrice: string
  totalSupply: number
  ownerCount: number
  volume24h: string
}

/** Coupon validation result */
export interface CouponValidation {
  code: string
  valid: boolean
  discountType: 'percentage' | 'fixed'
  discountValue: number
  minPrice: string
  maxDiscount: string
  expiresAt: string | null
  error?: string
}
/** Real-time NFT update event payload */
export interface NftUpdatedEvent {
  nftId: string
  version: number
  priceEth: string
  availability: number
  updatedAt: string
}

/** Real-time order update event payload */
export interface OrderUpdatedEvent {
  orderId: string
  version: number
  status: Exclude<OrderStatus, 'completed'>
  transactionId?: string
  explorerUrl?: string
  updatedAt: string
}

/** Public aliases for the documented domain models */
export type User = UserSummary
export type Session = AuthSession
export type Nft = NftSummary
export type Collection = CollectionSummary
export type Cart = CartItem[]
export type Order = OrderSummary
export type PaginatedResponse<T> = ApiResponse<T[]>
