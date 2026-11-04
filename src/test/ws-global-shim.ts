/**
 * Test-only `ws` shim.
 *
 * On Node, `engine.io-client` builds its websocket transport on the `ws`
 * package, which MSW does not intercept. This alias re-exports the global
 * `WebSocket` that MSW's `WebSocketInterceptor` has already patched, so the
 * Socket.IO transport routes through the mock layer.
 */

const { WebSocket } = globalThis as unknown as {
  WebSocket: new (url: string, protocols?: string | string[]) => EventTarget
}

export { WebSocket }
export default { WebSocket }
