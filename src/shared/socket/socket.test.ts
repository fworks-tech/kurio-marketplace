import { beforeEach, describe, expect, it } from 'vitest'
import { orderPending } from '../../mocks/fixtures/index'
import { must } from '../../test/helpers'
import { emitNftUpdated, emitOrderUpdated } from '../../mocks/socket'
import { getMockState, resetMockState, setOrder } from '../../mocks/state/mock-state'
import type { NftUpdatedEvent, OrderUpdatedEvent } from '../api/api-types'
import {
  createMockSocket,
  disposeMockSocket,
  reconcileOnReconnect,
  subscribeNftUpdates,
  type MockSocket
} from './client'

function nextEvent<T>(socket: MockSocket, event: string, timeoutMs = 3000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timed out waiting for ${event}`)), timeoutMs)
    socket.once(event as never, ((payload: T) => {
      clearTimeout(timer)
      resolve(payload)
    }) as never)
  })
}

async function connect(userId: string): Promise<MockSocket> {
  const socket = await createMockSocket({ userId, autoConnect: false })
  const subscribed = nextEvent(socket, 'subscribed')
  socket.connect()
  await subscribed
  return socket
}

const nftEvent = (version: number, priceEth = '3.5'): NftUpdatedEvent => ({
  nftId: 'nft-001',
  version,
  priceEth,
  availability: 4,
  updatedAt: new Date().toISOString()
})

const orderEvent = (version: number, status: OrderUpdatedEvent['status']): OrderUpdatedEvent => ({
  orderId: orderPending.id,
  version,
  status,
  updatedAt: new Date().toISOString()
})

describe('mock socket layer', () => {
  beforeEach(() => {
    resetMockState()
  })

  it('delivers versioned NFT updates through socket.io-client', async () => {
    const socket = await connect('user-alice')
    const received = nextEvent<NftUpdatedEvent>(socket, 'nft.updated')

    expect(emitNftUpdated(nftEvent(2, '4.25'))).toBe(true)

    const event = await received
    expect(event.priceEth).toBe('4.25')
    expect(must(getMockState().nfts[0]).price).toBe('4.25')
    expect(must(getMockState().nfts[0]).version).toBe(2)

    disposeMockSocket(socket)
  })

  it('ignores duplicate and outdated NFT versions', async () => {
    const socket = await connect('user-alice')
    const received = nextEvent<NftUpdatedEvent>(socket, 'nft.updated')

    emitNftUpdated(nftEvent(5))
    await received

    expect(emitNftUpdated(nftEvent(5))).toBe(false)
    expect(emitNftUpdated(nftEvent(4))).toBe(false)
    expect(must(getMockState().nfts[0]).version).toBe(5)

    disposeMockSocket(socket)
  })

  it('scopes order updates to the subscribed session', async () => {
    setOrder(orderPending)
    const alice = await connect('user-alice')
    const bob = await connect('user-bob')
    let bobEvents = 0
    bob.on('order.updated', () => {
      bobEvents += 1
    })

    const received = nextEvent<OrderUpdatedEvent>(alice, 'order.updated')
    emitOrderUpdated(orderEvent(2, 'confirmed'), 'user-alice')

    const event = await received
    expect(event.status).toBe('confirmed')
    expect(getMockState().order?.status).toBe('confirmed')

    await new Promise((resolve) => setTimeout(resolve, 150))
    expect(bobEvents).toBe(0)

    disposeMockSocket(alice)
    disposeMockSocket(bob)
  })

  it('reconciles REST state after a reconnect', async () => {
    const socket = await createMockSocket({ userId: 'user-alice', autoConnect: false })
    let reconciliations = 0
    reconcileOnReconnect(socket, () => {
      reconciliations += 1
    })

    const subscribed = nextEvent(socket, 'subscribed')
    socket.connect()
    await subscribed

    socket.io.engine.close()

    const deadline = Date.now() + 3000
    while (reconciliations === 0 && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 50))
    }

    expect(reconciliations).toBeGreaterThan(0)

    disposeMockSocket(socket)
  })

  it('removes subscriptions on cleanup', async () => {
    const socket = await connect('user-alice')
    let received = 0
    const unsubscribe = subscribeNftUpdates(socket, () => {
      received += 1
    })

    const first = nextEvent<NftUpdatedEvent>(socket, 'nft.updated')
    emitNftUpdated(nftEvent(2))
    await first
    unsubscribe()

    emitNftUpdated(nftEvent(3))
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(received).toBe(1)

    disposeMockSocket(socket)
  })
})
