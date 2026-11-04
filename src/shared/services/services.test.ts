import { beforeEach, describe, expect, it } from 'vitest'
import { api } from '../api/http-client'
import { ApiError } from '../api/api-error'
import { nftAvailable } from '../../mocks/fixtures/index'
import { must } from '../../test/helpers'
import { SCENARIO_HEADER } from '../../mocks/scenarios'
import { resetMockState } from '../../mocks/state/mock-state'
import {
  authService,
  cartService,
  favoritesService,
  nftService,
  orderService,
  profileService,
  quoteService,
  walletService
} from './index'

const WALLET_ADDRESS = `0x${'a'.repeat(40)}`

async function login() {
  return authService.login({ email: 'alice@example.com', password: 'password123' })
}

describe('api services', () => {
  beforeEach(() => {
    resetMockState()
    api.defaults.baseURL = 'http://localhost/api'
  })

  it('authenticates and exposes the session', async () => {
    const session = await login()
    expect(session.user.username).toBe('alice_crypto')

    const current = await authService.getSession()
    expect(current.user.id).toBe(session.user.id)

    expect(await authService.logout()).toBeNull()
    await expect(authService.getSession()).rejects.toBeInstanceOf(ApiError)
  })

  it('lists and retrieves NFTs with typed pagination', async () => {
    const page = await nftService.list({ search: 'Dragon', sort: 'price_asc' })
    expect(page.meta.total).toBeGreaterThan(0)
    expect(page.data.every((nft) => nft.title.toLowerCase().includes('dragon'))).toBe(true)

    const detail = await nftService.getById(must(nftAvailable[0]).id)
    expect(detail.id).toBe(must(nftAvailable[0]).id)
    expect(detail.stats).toBeDefined()

    await expect(nftService.getById('missing')).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND'
    })
  })

  it('manages favorites for the authenticated user', async () => {
    await login()

    const added = await favoritesService.add(must(nftAvailable[0]).id)
    expect(added.favorites).toContain(must(nftAvailable[0]).id)

    const listed = await favoritesService.list()
    expect(listed.favorites.map((favorite) => favorite.id)).toContain(must(nftAvailable[0]).id)

    const removed = await favoritesService.remove(must(nftAvailable[0]).id)
    expect(removed.favorites).not.toContain(must(nftAvailable[0]).id)
  })

  it('manages cart items and quotes', async () => {
    await login()

    const added = await cartService.add({ nftId: must(nftAvailable[0]).id, quantity: 2 })
    expect(must(added[0]).quantity).toBe(2)

    const updated = await cartService.updateQuantity(must(nftAvailable[0]).id, { quantity: 3 })
    expect(must(updated[0]).quantity).toBe(3)

    const quote = await quoteService.create({ network: 'polygon', code: 'WELCOME10' })
    expect(quote.network).toBe('polygon')
    expect(quote.couponCode).toBe('WELCOME10')
    expect(quote.total).not.toBe(quote.subtotal)

    const revalidated = await quoteService.revalidate(quote.id)
    expect(revalidated.id).toBe(quote.id)

    const emptied = await cartService.remove(must(nftAvailable[0]).id)
    expect(emptied).toHaveLength(0)
  })

  it('creates idempotent orders and reads receipts', async () => {
    await login()
    await cartService.add({ nftId: must(nftAvailable[0]).id, quantity: 1 })

    const order = await orderService.create({}, { idempotencyKey: 'service-order-1' })
    expect(order.status).toBe('pending')
    expect(order.version).toBe(1)

    const replay = await orderService.create({}, { idempotencyKey: 'service-order-1' })
    expect(replay.id).toBe(order.id)

    expect((await orderService.getById(order.id)).id).toBe(order.id)
    const receipt = await orderService.getReceipt(order.id)
    expect(receipt.id).toBe(order.id)
    expect(receipt.items).toEqual(order.items)
  })

  it('updates profile fields, avatar, and password', async () => {
    await login()

    const updated = await profileService.update({ username: 'alice_updated' })
    expect(updated.username).toBe('alice_updated')

    const avatar = await profileService.updateAvatar('/avatar-new.png')
    expect(avatar.avatar).toBe('/avatar-new.png')

    const changed = await profileService.changePassword({
      currentPassword: 'password123',
      newPassword: 'password456'
    })
    expect(changed.changed).toBe(true)

    await authService.logout()
    const session = await authService.login({
      email: 'alice@example.com',
      password: 'password456'
    })
    expect(session.user.username).toBe('alice_updated')
  })

  it('lists, creates, and promotes wallets', async () => {
    await login()

    const existing = await walletService.list()
    expect(existing.some((wallet) => wallet.isPrimary)).toBe(true)

    const created = await walletService.create({
      address: WALLET_ADDRESS,
      label: 'Trading',
      network: 'Polygon'
    })
    expect(created.isPrimary).toBe(false)

    const promoted = await walletService.update(created.id, { isPrimary: true })
    expect(promoted.isPrimary).toBe(true)

    const wallets = await walletService.list()
    expect(wallets.filter((wallet) => wallet.isPrimary)).toHaveLength(1)
    expect(wallets.find((wallet) => wallet.isPrimary)?.id).toBe(created.id)
  })

  it('normalizes simulated network failures', async () => {
    await expect(
      nftService.list({}, { headers: { [SCENARIO_HEADER]: 'network-failure' } })
    ).rejects.toMatchObject({ code: 'NETWORK_ERROR', status: 0, type: 'network' })
  })

  it('honors cancellation signals', async () => {
    const controller = new AbortController()
    controller.abort()

    await expect(nftService.list({}, { signal: controller.signal })).rejects.toBeInstanceOf(Error)
  })
})
