/**
 * Typed API services.
 *
 * Services only translate domain calls into documented REST requests.
 * They never import fixtures, mock state, or UI code.
 */

import {
  generateIdempotencyKey,
  request,
  requestPage,
  type PageResult
} from '../api/http-client'
import type {
  AddCartItemDto,
  AuthSession,
  CartItem,
  CartQuote,
  ChangePasswordDto,
  CreateOrderDto,
  CreateWalletDto,
  Favorite,
  LoginDto,
  NftDetail,
  NftFacets,
  NftListParams,
  NftSummary,
  OrderSummary,
  QuoteRequestDto,
  RegisterDto,
  UpdateCartItemDto,
  UpdateProfileDto,
  UpdateWalletDto,
  UserSummary,
  Wallet
} from '../api/api-types'
import {
  authSessionSchema,
  cartItemListSchema,
  cartQuoteSchema,
  nftFacetsSchema,
  nftSummarySchema,
  orderSummarySchema,
  walletListSchema,
  walletSchema
} from '../api/schemas'

/** Optional per-request controls */
export interface ServiceOptions {
  signal?: AbortSignal
  headers?: Record<string, string>
}

function queryString(params: object): string {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value))
    }
  }
  const serialized = query.toString()
  return serialized ? `?${serialized}` : ''
}

export const authService = {
  register(dto: RegisterDto, options: ServiceOptions = {}) {
    return request<AuthSession>(
      { method: 'POST', url: '/auth/register', data: dto, ...options },
      authSessionSchema
    )
  },
  login(dto: LoginDto, options: ServiceOptions = {}) {
    return request<AuthSession>(
      { method: 'POST', url: '/auth/login', data: dto, ...options },
      authSessionSchema
    )
  },
  getSession(options: ServiceOptions = {}) {
    return request<AuthSession>(
      { method: 'GET', url: '/auth/session', ...options },
      authSessionSchema
    )
  },
  logout(options: ServiceOptions = {}) {
    return request<null>({ method: 'POST', url: '/auth/logout', ...options })
  }
}

export const nftService = {
  list(params: NftListParams = {}, options: ServiceOptions = {}): Promise<PageResult<NftSummary>> {
    return requestPage<NftSummary>(
      {
        method: 'GET',
        url: `/nfts${queryString(params)}`,
        ...options
      },
      nftSummarySchema
    )
  },
  getById(nftId: string, options: ServiceOptions = {}) {
    return request<NftDetail>({ method: 'GET', url: `/nfts/${nftId}`, ...options })
  },
  facets(options: ServiceOptions = {}): Promise<NftFacets> {
    return request<NftFacets>({ method: 'GET', url: '/nfts/facets', ...options }, nftFacetsSchema)
  }
}

export const favoritesService = {
  list(options: ServiceOptions = {}) {
    return request<{ favorites: Favorite[] }>({ method: 'GET', url: '/favorites', ...options })
  },
  add(nftId: string, options: ServiceOptions = {}) {
    return request<{ favorites: string[] }>({
      method: 'POST',
      url: `/favorites/${nftId}`,
      ...options
    })
  },
  remove(nftId: string, options: ServiceOptions = {}) {
    return request<{ favorites: string[] }>({
      method: 'DELETE',
      url: `/favorites/${nftId}`,
      ...options
    })
  }
}

export const cartService = {
  get(options: ServiceOptions = {}) {
    return request<CartItem[]>({ method: 'GET', url: '/cart', ...options }, cartItemListSchema)
  },
  add(dto: AddCartItemDto, options: ServiceOptions = {}) {
    return request<CartItem[]>(
      { method: 'POST', url: '/cart/items', data: dto, ...options },
      cartItemListSchema
    )
  },
  updateQuantity(nftId: string, dto: UpdateCartItemDto, options: ServiceOptions = {}) {
    return request<CartItem[]>(
      {
        method: 'PATCH',
        url: `/cart/items/${nftId}`,
        data: dto,
        ...options
      },
      cartItemListSchema
    )
  },
  remove(nftId: string, options: ServiceOptions = {}) {
    return request<CartItem[]>(
      {
        method: 'DELETE',
        url: `/cart/items/${nftId}`,
        ...options
      },
      cartItemListSchema
    )
  }
}

export const quoteService = {
  create(dto: QuoteRequestDto = {}, options: ServiceOptions = {}) {
    return request<CartQuote>(
      { method: 'POST', url: '/cart/quote', data: dto, ...options },
      cartQuoteSchema
    )
  },
  revalidate(quoteId: string, options: ServiceOptions = {}) {
    return request<CartQuote>(
      {
        method: 'POST',
        url: '/cart/quote',
        data: { quoteId },
        ...options
      },
      cartQuoteSchema
    )
  }
}

export const orderService = {
  create(dto: CreateOrderDto = {}, options: ServiceOptions & { idempotencyKey?: string } = {}) {
    const { idempotencyKey = generateIdempotencyKey(), ...rest } = options
    return request<OrderSummary>(
      {
        method: 'POST',
        url: '/orders',
        data: dto,
        headers: { 'Idempotency-Key': idempotencyKey },
        ...rest
      },
      orderSummarySchema
    )
  },
  getById(orderId: string, options: ServiceOptions = {}) {
    return request<OrderSummary>(
      { method: 'GET', url: `/orders/${orderId}`, ...options },
      orderSummarySchema
    )
  },
  getReceipt(orderId: string, options: ServiceOptions = {}) {
    return request<OrderSummary>(
      {
        method: 'GET',
        url: `/orders/${orderId}/receipt`,
        ...options
      },
      orderSummarySchema
    )
  }
}

export const profileService = {
  get(options: ServiceOptions = {}) {
    return request<UserSummary>({ method: 'GET', url: '/profile', ...options })
  },
  update(dto: UpdateProfileDto, options: ServiceOptions = {}) {
    return request<UserSummary>({ method: 'PATCH', url: '/profile', data: dto, ...options })
  },
  updateAvatar(avatar: string | null, options: ServiceOptions = {}) {
    return request<UserSummary>({
      method: 'POST',
      url: '/profile/avatar',
      data: { avatar },
      ...options
    })
  },
  changePassword(dto: ChangePasswordDto, options: ServiceOptions = {}) {
    return request<{ changed: boolean }>({
      method: 'POST',
      url: '/profile/password',
      data: dto,
      ...options
    })
  }
}

export const walletService = {
  list(options: ServiceOptions = {}) {
    return request<Wallet[]>({ method: 'GET', url: '/wallets', ...options }, walletListSchema)
  },
  create(dto: CreateWalletDto, options: ServiceOptions = {}) {
    return request<Wallet>({ method: 'POST', url: '/wallets', data: dto, ...options }, walletSchema)
  },
  update(walletId: string, dto: UpdateWalletDto, options: ServiceOptions = {}) {
    return request<Wallet>(
      {
        method: 'PATCH',
        url: `/wallets/${walletId}`,
        data: dto,
        ...options
      },
      walletSchema
    )
  }
}
