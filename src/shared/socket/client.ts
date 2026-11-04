/**
 * Socket.IO client helpers.
 *
 * The app consumes real `socket.io-client` events; MSW and the socket binding
 * simulate the server. Subscriptions are session-scoped and removable.
 */

import type { Socket } from 'socket.io-client'
import type { NftUpdatedEvent, OrderUpdatedEvent } from '../api/api-types'

export interface ServerToClientEvents {
  'nft.updated': (event: NftUpdatedEvent) => void
  'order.updated': (event: OrderUpdatedEvent) => void
  subscribed: (payload: { userId: string | null }) => void
}

export interface ClientToServerEvents {
  subscribe: (payload: { userId?: string | null }) => void
  unsubscribe: () => void
}

export type MockSocket = Socket<ServerToClientEvents, ClientToServerEvents>

export interface MockSocketOptions {
  url?: string
  path?: string
  userId?: string | null
  autoConnect?: boolean
  debug?: boolean
  onReconnect?: () => void
}

function defaultUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return 'http://localhost'
}

type SocketIoModule = typeof import('socket.io-client')

let socketIo: SocketIoModule | null = null

/**
 * Load `socket.io-client` lazily.
 *
 * The engine.io transport captures `globalThis.WebSocket` when its module is
 * evaluated. MSW only replaces that constructor when the worker starts, so the
 * module must be imported *after* the mock layer is active — a static import
 * would capture the native WebSocket and every event would be lost.
 */
async function loadSocketIo(): Promise<SocketIoModule> {
  socketIo ??= await import('socket.io-client')
  return socketIo
}

/**
 * Create a Socket.IO client wired to the mock server.
 */
export async function createMockSocket(options: MockSocketOptions = {}): Promise<MockSocket> {
  const { io } = await loadSocketIo()
  const socket = io(options.url ?? defaultUrl(), {
    path: options.path ?? '/socket',
    transports: ['websocket'],
    autoConnect: options.autoConnect ?? true,
    reconnection: true,
    reconnectionDelay: 50,
    auth: { userId: options.userId ?? null }
  }) as MockSocket

  socket.on('connect', () => {
    socket.emit('subscribe', { userId: options.userId ?? null })
  })

  if (options.onReconnect) {
    socket.io.on('reconnect', options.onReconnect)
  }

  if (options.debug) {
    socket.onAny((event) => {
      // eslint-disable-next-line no-console -- event names only, no payload
      console.debug('[mock socket]', event)
    })
  }

  return socket
}

/** Subscribe to NFT updates; returns the cleanup function */
export function subscribeNftUpdates(
  socket: MockSocket,
  handler: (event: NftUpdatedEvent) => void
): () => void {
  socket.on('nft.updated', handler)
  return () => socket.off('nft.updated', handler)
}

/** Subscribe to order updates; returns the cleanup function */
export function subscribeOrderUpdates(
  socket: MockSocket,
  handler: (event: OrderUpdatedEvent) => void
): () => void {
  socket.on('order.updated', handler)
  return () => socket.off('order.updated', handler)
}

/** Run a REST reconciliation callback after every reconnect */
export function reconcileOnReconnect(socket: MockSocket, reconcile: () => void): () => void {
  socket.io.on('reconnect', reconcile)
  return () => socket.io.off('reconnect', reconcile)
}

/** Disconnect and remove every listener owned by this client */
export function disposeMockSocket(socket: MockSocket): void {
  socket.emit('unsubscribe')
  socket.removeAllListeners()
  socket.io.removeAllListeners()
  socket.disconnect()
}
