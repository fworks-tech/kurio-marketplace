/**
 * Zod response/request contracts (Epic 22).
 *
 * Each schema is annotated `z.ZodType<TargetType>` so TypeScript fails to
 * compile if the runtime shape drifts from the declared domain type — the type
 * stays the single source of truth, Zod only guards the boundary at runtime.
 */

import { z } from 'zod'
import type {
  ApiErrorResponse,
  AuthSession,
  CartItem,
  CartQuote,
  NftFacets,
  NftSummary,
  NftUpdatedEvent,
  OrderSummary,
  OrderUpdatedEvent,
  Wallet
} from './api-types'

const isoDateTime = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/)
const money = z.string().regex(/^\d+(\.\d+)?$/)

export const nftSummarySchema: z.ZodType<NftSummary> = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  imageUrl: z.string(),
  owner: z.string(),
  price: money,
  royalty: z.number(),
  edition: z.number(),
  totalEdition: z.number(),
  isAvailable: z.boolean(),
  isFavorite: z.boolean(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
  version: z.number().optional(),
  isFeatured: z.boolean().optional(),
  attributes: z
    .array(z.object({ traitType: z.string(), value: z.union([z.string(), z.number()]) }))
    .optional(),
  collectionId: z.string().optional(),
  network: z.string().optional(),
  stats: z
    .object({ viewCount: z.number(), bidCount: z.number(), floorPrice: money })
    .optional()
})

const nftFacetOptionSchema = z.object({ value: z.string(), label: z.string(), count: z.number() })

export const nftFacetsSchema: z.ZodType<NftFacets> = z.object({
  collections: z.array(nftFacetOptionSchema),
  networks: z.array(nftFacetOptionSchema),
  minPrice: money,
  maxPrice: money
})

export const cartItemSchema: z.ZodType<CartItem> = z.object({
  nftId: z.string(),
  price: money,
  quantity: z.number(),
  total: money,
  nft: nftSummarySchema
})

export const cartQuoteSchema: z.ZodType<CartQuote> = z.object({
  id: z.string(),
  items: z
    .array(
      z.object({
        nftId: z.string(),
        version: z.number(),
        quantity: z.number(),
        unitPrice: money,
        total: money
      })
    )
    .min(1),
  subtotal: money,
  discount: money,
  discountType: z.enum(['percentage', 'fixed']).nullable(),
  discountValue: z.number(),
  couponCode: z.string().nullable(),
  network: z.enum(['ethereum', 'polygon', 'base']),
  networkFee: money,
  total: money,
  createdAt: isoDateTime,
  expiresAt: isoDateTime
})

export const orderSummarySchema: z.ZodType<OrderSummary> = z.object({
  id: z.string(),
  status: z.enum(['pending', 'confirmed', 'rejected', 'completed']),
  version: z.number().optional(),
  price: money,
  fee: money,
  total: money,
  items: z
    .array(
      z.object({
        nftId: z.string(),
        nft: nftSummarySchema,
        quantity: z.number(),
        unitPrice: money,
        total: money
      })
    )
    .min(1),
  subtotal: money,
  discount: money,
  couponCode: z.string().nullable(),
  network: z.enum(['ethereum', 'polygon', 'base']),
  transactionId: z.string().optional(),
  explorerUrl: z.string().optional(),
  createdAt: isoDateTime,
  nft: nftSummarySchema,
  buyer: z.object({
    id: z.string(),
    address: z.string(),
    username: z.string(),
    avatar: z.string().nullable(),
    walletCount: z.number(),
    totalVolume: money,
    isVerified: z.boolean()
  })
})

export const authSessionSchema: z.ZodType<AuthSession> = z.object({
  user: z.object({
    id: z.string(),
    address: z.string(),
    username: z.string(),
    avatar: z.string().nullable(),
    walletCount: z.number(),
    totalVolume: money,
    isVerified: z.boolean()
  }),
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresAt: isoDateTime
})

export const walletSchema: z.ZodType<Wallet> = z.object({
  id: z.string(),
  address: z.string(),
  label: z.string(),
  network: z.string(),
  isPrimary: z.boolean()
})

export const apiErrorSchema: z.ZodType<ApiErrorResponse> = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    field: z.string().optional(),
    fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
    details: z.unknown().optional(),
    type: z.enum(['validation', 'not_found', 'unauthorized', 'forbidden', 'conflict', 'server_error'])
  }),
  timestamp: isoDateTime,
  requestId: z.string()
})

export const nftUpdatedEventSchema: z.ZodType<NftUpdatedEvent> = z.object({
  nftId: z.string(),
  version: z.number().int().nonnegative(),
  priceEth: money,
  availability: z.number().int().nonnegative(),
  updatedAt: isoDateTime
})

export const orderUpdatedEventSchema: z.ZodType<OrderUpdatedEvent> = z.object({
  orderId: z.string(),
  version: z.number().int().nonnegative(),
  status: z.enum(['pending', 'confirmed', 'rejected']),
  transactionId: z.string().optional(),
  explorerUrl: z.string().optional(),
  updatedAt: isoDateTime
})

/** List-shaped collection responses validated at the HTTP boundary */
export const cartItemListSchema: z.ZodType<CartItem[]> = z.array(cartItemSchema)
export const walletListSchema: z.ZodType<Wallet[]> = z.array(walletSchema)
