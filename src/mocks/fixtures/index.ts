/**
 * Centralized mock fixtures for the NFT Marketplace.
 *
 * Provides deterministic fixture data for all API endpoints.
 * Fixtures are pure data structures that match the types defined
 * in src/shared/api/api-types.ts.
 *
 * Key principles:
 * - No React component imports directly (acceptance criteria)
 * - Centralized source of truth for mock data
 * - Easy to update for new scenarios
 * - Supports multiple user isolation scenarios
 *
 * @module mocks/fixtures
 * @see src/shared/api/api-types - Type definitions fixtures must match
 * @see src/mocks/state/mock-state.ts - State consumer
 */

import type {
  NftSummary,
  UserSummary,
  CartItem,
  OrderSummary,
  AuthSession,
  Wallet,
  PaginationParams
} from '../../shared/api/api-types'

function pick(list: NftSummary[], index: number): NftSummary {
  const item = list[index]
  if (!item) {
    throw new Error(`NFT fixture at index ${index} is missing`)
  }
  return item
}

/** Collection vocabulary shown by the catalog sidebar (Figma order). */
export const COLLECTION_LABELS: Record<string, string> = {
  'arte-digital': 'Arte digital',
  fotografia: 'Fotografia',
  musica: 'Música',
  'arte-3d': 'Arte 3D',
  colecionaveis: 'Colecionáveis',
  generativa: 'Generativa',
  jogos: 'Jogos',
  assinaturas: 'Assinaturas',
  utilidade: 'Utilidade'
}

/** Blockchain facet order shown by the catalog sidebar (Figma order). */
export const NETWORK_ORDER: readonly string[] = ['Ethereum', 'Polygon', 'Solana']

/** Demo price pool: bounds 0.02-12.3 ETH; values stay outside the 2-3 ETH range asserted by contract tests */
const demoPrices: readonly string[] = [
  '0.02', '0.15', '0.35', '0.6', '0.85', '1.1', '1.45', '1.8', '1.95',
  '3.05', '3.4', '3.85', '4.3', '4.9', '5.4', '6.15', '6.9', '7.6',
  '8.4', '9.2', '10.1', '10.9', '11.6', '12.3'
]

/** Word pools for generated titles - keep 'ape'/'lotus' search fixtures unique to hand-written NFTs */
const titlePrefixes = [
  'Neon', 'Cosmic', 'Pixel', 'Chrome', 'Quantum', 'Aurora', 'Retro', 'Ghost', 'Astro',
  'Vapor', 'Obsidian', 'Prism', 'Crypto', 'Mystic', 'Digital', 'Lava', 'Stellar', 'Solar',
  'Void'
]
const titleSubjects = [
  'Samurai', 'Whale', 'Punk', 'Serpent', 'Fox', 'Wolf', 'Bot', 'Koi', 'Cat',
  'Rider', 'Golem', 'Parrot', 'Skull', 'Owl', 'Deer', 'Tiger', 'Moth', 'Shark', 'Bee'
]

/**
 * Facet bags for the 279 generated NFTs. Together with the hand-written fixtures they
 * reproduce the sidebar counts from the Figma design (collections sum to the 282
 * available NFTs, networks sum to the full 283-item catalog).
 */
const demoCollectionCounts: Record<string, number> = {
  'arte-digital': 38,
  fotografia: 14,
  musica: 77,
  'arte-3d': 46,
  colecionaveis: 27,
  generativa: 19,
  jogos: 23,
  assinaturas: 16,
  utilidade: 19
}

const demoNetworkCounts: Record<string, number> = {
  Ethereum: 117,
  Polygon: 77,
  Solana: 85
}

const demoImages = [
  '/images/nft-03.webp',
  '/images/nft-04.webp',
  '/images/nft-05.webp',
  '/images/nft-06.webp',
  '/images/nft-07.webp',
  '/images/nft-09.webp',
  '/images/nft-18.webp'
]

const demoOwners = ['0x1234...abcd', '0x1234...efgh', '0x1234...ijkl', '0xabcd...1234']
const demoRarities = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary']
const demoStyles = ['Neon', 'Retro', 'Minimal', 'Vapor']
const demoEditions = [1, 10, 25, 50, 100]
const demoRoyalties = [3, 5, 7, 8, 10]
const demoFeatured = new Set([1, 4, 7, 10, 13, 16, 19, 22])

function demo<T>(list: readonly T[], index: number): T {
  const item = list[index % list.length]
  if (item === undefined) {
    throw new Error(`demo fixture value at index ${index} is missing`)
  }
  return item
}

function bagValue(bag: readonly string[], index: number): string {
  const value = bag[index]
  if (!value) {
    throw new Error(`fixture bag value at index ${index} is missing`)
  }
  return value
}

/** Interleave facet values so sorted pages mix collections and networks instead of clustering them. */
function roundRobinBag(counts: Record<string, number>): string[] {
  const left = new Map(Object.entries(counts))
  const bag: string[] = []
  while (left.size > 0) {
    for (const [value, count] of [...left]) {
      bag.push(value)
      if (count <= 1) left.delete(value)
      else left.set(value, count - 1)
    }
  }
  return bag
}

const DEMO_NFT_COUNT = 279
const demoCollectionBag = roundRobinBag(demoCollectionCounts)
const demoNetworkBag = roundRobinBag(demoNetworkCounts)

/** Generated demo NFTs - fills the catalog so pagination, sorting, tabs, and facets are exercisable */
const demoNfts: NftSummary[] = Array.from({ length: DEMO_NFT_COUNT }, (_, index) => {
  const title = `${demo(titlePrefixes, index)} ${demo(
    titleSubjects,
    Math.floor(index / titlePrefixes.length)
  )} #${index + 11}`
  const price = demo(demoPrices, index)
  const createdAt = new Date(Date.UTC(2024, 2, 20) + index * 86_400_000).toISOString()
  return {
    id: `nft-${String(index + 11).padStart(3, '0')}`,
    title,
    isFeatured: demoFeatured.has(index),
    version: 1,
    description: `${title} - demo catalog NFT`,
    imageUrl: demo(demoImages, index),
    owner: demo(demoOwners, index),
    price,
    royalty: demo(demoRoyalties, index),
    edition: 1,
    totalEdition: demo(demoEditions, index),
    isAvailable: true,
    isFavorite: false,
    createdAt,
    updatedAt: createdAt,
    attributes: [
      { traitType: 'Rarity', value: demo(demoRarities, index) },
      { traitType: 'Style', value: demo(demoStyles, index) }
    ],
    stats: {
      viewCount: 150 + index * 173,
      bidCount: (index * 7) % 50,
      floorPrice: price
    },
    collectionId: bagValue(demoCollectionBag, index),
    network: bagValue(demoNetworkBag, index)
  }
})

/** NFT fixture data - available NFTs in catalog */
export const nftAvailable: NftSummary[] = [
  {
    id: 'nft-001',
    title: 'Cyberpunk Ape #1',
    isFeatured: true,
    version: 1,
    description: 'A rare cyberpunk-style ape NFT',
    imageUrl: '/images/nft-03.webp',
    owner: '0x1234...abcd',
    price: '2.5',
    royalty: 5,
    edition: 1,
    totalEdition: 10,
    isAvailable: true,
    isFavorite: false,
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    attributes: [
      { traitType: 'Rarity', value: 'Legendary' },
      { traitType: 'Color', value: 'Midnight' }
    ],
    stats: {
      viewCount: 1245,
      bidCount: 23,
      floorPrice: '1.8'
    },
    collectionId: 'arte-digital',
    network: 'Ethereum'
  },
  {
    id: 'nft-002',
    title: 'Solar Flare Dragon',
    isFeatured: true,
    version: 2,
    description: 'A fiery dragon NFT with solar properties',
    imageUrl: '/images/nft-05.webp',
    owner: '0x1234...efgh',
    price: '8.75',
    royalty: 8,
    edition: 1,
    totalEdition: 50,
    isAvailable: true,
    isFavorite: false,
    createdAt: '2024-02-10T14:20:00Z',
    updatedAt: '2024-02-10T14:20:00Z',
    attributes: [
      { traitType: 'Rarity', value: 'Epic' },
      { traitType: 'Element', value: 'Fire' }
    ],
    stats: {
      viewCount: 2891,
      bidCount: 45,
      floorPrice: '6.2'
    },
    collectionId: 'generativa',
    network: 'Polygon'
  },
  {
    id: 'nft-003',
    title: 'Midnight Lotus',
    isFeatured: false,
    version: 3,
    description: 'An elegant lotus NFT with subtle glow',
    imageUrl: '/images/nft-06.webp',
    owner: '0x1234...ijkl',
    price: '1.2',
    royalty: 3,
    edition: 2,
    totalEdition: 100,
    isAvailable: true,
    isFavorite: false,
    createdAt: '2024-03-05T09:10:00Z',
    updatedAt: '2024-03-05T09:10:00Z',
    attributes: [
      { traitType: 'Rarity', value: 'Rare' },
      { traitType: 'Color', value: 'Purple' }
    ],
    stats: {
      viewCount: 421,
      bidCount: 8,
      floorPrice: '0.9'
    },
    collectionId: 'arte-digital',
    network: 'Solana'
  },
  ...demoNfts
]

/** Sold-out NFT fixtures */
export const nftSoldOut: NftSummary[] = [
  {
    id: 'nft-010',
    title: 'Golden Dragon #5',
    isFeatured: false,
    version: 1,
    description: 'Sold-out NFT - no longer available',
    imageUrl: '/images/nft-07.webp',
    owner: '0x1234...abcd',
    price: '0',
    royalty: 10,
    edition: 5,
    totalEdition: 5,
    isAvailable: false,
    isFavorite: false,
    createdAt: '2024-01-10T10:30:00Z',
    updatedAt: '2024-01-10T10:30:00Z',
    attributes: [
      { traitType: 'Rarity', value: 'Epic' },
      { traitType: 'Color', value: 'Gold' }
    ],
    stats: {
      viewCount: 2891,
      bidCount: 45,
      floorPrice: '0'
    },
    network: 'Ethereum'
  }
]

/** Empty catalog fixture */
export const nftEmpty: NftSummary[] = []

/** User fixtures - isolated scenarios */
export const userAlice: UserSummary = {
  id: 'user-alice',
  address: '0xAlice...123',
  username: 'alice_crypto',
  displayName: 'Alice Neumann',
  email: 'alice@example.com',
  ensName: 'alicen',
  avatar: '/avatar-alice.png',
  walletCount: 2,
  totalVolume: '15.5',
  isVerified: true
}

export const userBob: UserSummary = {
  id: 'user-bob',
  address: '0xBob...456',
  username: 'bob_wallet',
  displayName: 'Bob Vasquez',
  email: 'bob@example.com',
  ensName: 'bobv',
  avatar: '/avatar-bob.png',
  walletCount: 1,
  totalVolume: '3.2',
  isVerified: false
}

/** Authenticated session fixture for Alice */
export const sessionAlice: AuthSession = {
  user: userAlice,
  accessToken: 'token-alice',
  refreshToken: 'refresh-alice',
  expiresAt: '2099-01-01T00:00:00Z'
}

/** Primary wallet fixture for Alice */
export const walletPrimary: Wallet = {
  id: 'wallet-primary',
  address: userAlice.address,
  label: 'Primary Wallet',
  network: 'Ethereum Mainnet',
  isPrimary: true
}

/** Favorites fixture for Alice */
export const favoritesForAlice: string[] = ['nft-001', 'nft-003']

/** Empty cart fixture */
export const cartEmpty: CartItem[] = []

/** Cart with items fixture */
export const cartWithItems: CartItem[] = [
  {
    nftId: 'nft-001',
    price: '2.5',
    quantity: 1,
    total: '2.5',
    nft: pick(nftAvailable, 0)
  }
]

/** Pending order fixture */
export const orderPending: OrderSummary = {
  id: 'order-003',
  status: 'pending',
  version: 1,
  price: '1.2',
  fee: '0.005',
  total: '1.205',
  items: [
    {
      nftId: pick(nftAvailable, 2).id,
      nft: pick(nftAvailable, 2),
      quantity: 1,
      unitPrice: '1.2',
      total: '1.2'
    }
  ],
  subtotal: '1.2',
  discount: '0',
  couponCode: null,
  network: 'ethereum',
  createdAt: '2024-03-01T11:00:00Z',
  nft: pick(nftAvailable, 2),
  buyer: userAlice
}

/** Order success fixture */
export const orderSuccess: OrderSummary = {
  id: 'order-001',
  status: 'confirmed',
  version: 1,
  price: '2.5',
  fee: '0.15',
  total: '2.65',
  items: [
    {
      nftId: pick(nftAvailable, 0).id,
      nft: pick(nftAvailable, 0),
      quantity: 1,
      unitPrice: '2.5',
      total: '2.5'
    }
  ],
  subtotal: '2.5',
  discount: '0',
  couponCode: null,
  network: 'ethereum',
  createdAt: '2024-01-20T14:30:00Z',
  nft: pick(nftAvailable, 0),
  buyer: userAlice
}

/** Order rejected fixture */
export const orderRejected: OrderSummary = {
  id: 'order-002',
  status: 'rejected',
  version: 1,
  price: '8.75',
  fee: '0.52',
  total: '9.27',
  items: [
    {
      nftId: pick(nftAvailable, 1).id,
      nft: pick(nftAvailable, 1),
      quantity: 1,
      unitPrice: '8.75',
      total: '8.75'
    }
  ],
  subtotal: '8.75',
  discount: '0',
  couponCode: null,
  network: 'ethereum',
  createdAt: '2024-02-15T16:45:00Z',
  nft: pick(nftAvailable, 1),
  buyer: userBob
}

/** Empty order fixture */
export const orderEmpty: OrderSummary = {
  id: '',
  status: 'pending',
  version: 0,
  price: '0',
  fee: '0',
  total: '0',
  items: [],
  subtotal: '0',
  discount: '0',
  couponCode: null,
  network: 'ethereum',
  createdAt: new Date().toISOString(),
  nft: pick(nftAvailable, 0),
  buyer: userAlice
}

/** Coupon fixtures */
export const couponValid: { code: string; discount: number } = {
  code: 'WELCOME10',
  discount: 10
}

export const couponExpired: { code: string; reason: string } = {
  code: 'EXPIRED20',
  reason: 'Coupon has expired'
}

export const couponInvalid: { code: string; reason: string } = {
  code: 'INVALID99',
  reason: 'Invalid coupon code'
}

/** Pagination fixture */
export const paginationDefault: PaginationParams = {
  page: 1,
  limit: 20,
  sortBy: 'createdAt',
  sortOrder: 'desc'
}

/**
 * Get fixtures by scenario name.
 *
 * Useful for test scenarios that need specific data combinations.
 *
 * @param scenario - Scenario name ('alice-cart', 'bob-favorites', 'empty-catalog', etc.)
 * @returns Fixture object matching the scenario
 */
export function getFixtures(scenario: string): Record<string, unknown> {
  const scenarios: Record<string, Record<string, unknown>> = {
    'alice-cart': {
      user: userAlice,
      cart: cartWithItems,
      nfts: nftAvailable
    },
    'bob-cart': {
      user: userBob,
      cart: cartEmpty,
      nfts: nftSoldOut
    },
    'empty-catalog': {
      user: userAlice,
      cart: cartEmpty,
      nfts: nftEmpty
    },
    'two-users': {
      userAlice,
      userBob
    },
    'rejected-order': {
      user: userBob,
      order: orderRejected
    }
  }

  return scenarios[scenario] || {}
}

/**
 * Get all available scenarios.
 *
 * @returns Array of scenario names
 */
export function getAvailableScenarios(): string[] {
  return ['alice-cart', 'bob-cart', 'empty-catalog', 'two-users']
}