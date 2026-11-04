/**
 * Socket.IO mock binding.
 *
 * Uses MSW WebSocket interception plus `@mswjs/socket.io-binding` so the app
 * talks to a real `socket.io-client`. Events are broadcast to subscribed
 * sessions; sequence-sensitive events are versioned by the caller.
 */

import { toSocketIo } from '@mswjs/socket.io-binding'
import { ws } from 'msw'
import type { NftUpdatedEvent, OrderUpdatedEvent } from '../shared/api/api-types'
import { applyNftUpdate, applyOrderUpdate } from './state/mock-state'

interface SocketConnectionRecord {
  userId: string | null
  client: ReturnType<typeof toSocketIo>['client']
}

const connections = new Set<SocketConnectionRecord>()

/** WebSocket path intercepted by MSW and by the mock client */
export const SOCKET_PATH = '/socket'
export const SOCKET_URL = 'ws://localhost/socket'

export const socketHandler = ws
  .link('*/socket*')
  .addEventListener('connection', (connection) => {
    const io = toSocketIo(connection)
    const record: SocketConnectionRecord = { userId: null, client: io.client }
    connections.add(record)

    io.client.on('subscribe', (_event: MessageEvent, payload?: { userId?: string }) => {
      record.userId = payload?.userId ?? null
      record.client.emit('subscribed', { userId: record.userId })
    })
    io.client.on('unsubscribe', () => {
      record.userId = null
    })

    connection.client.addEventListener('close', () => {
      connections.delete(record)
    })
  })

function emitToAll(event: string, payload: unknown, userId?: string): void {
  for (const record of connections) {
    if (userId && record.userId !== userId) continue
    record.client.emit(event, payload)
  }
}

/** Update the catalog and broadcast an NFT update */
export function emitNftUpdated(event: NftUpdatedEvent): boolean {
  const applied = applyNftUpdate(event)
  if (applied) {
    emitToAll('nft.updated', event)
  }
  return applied
}

/** Update the stored order and broadcast to its owner when known */
export function emitOrderUpdated(event: OrderUpdatedEvent, userId?: string): void {
  applyOrderUpdate(event)
  emitToAll('order.updated', event, userId)
}

/** Test helper: current number of live mock socket connections */
export function getSocketConnectionCount(): number {
  return connections.size
}
