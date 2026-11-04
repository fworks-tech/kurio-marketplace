/**
 * MSW browser initialization for development environment.
 *
 * Activates MSW mock handlers in the browser during development.
 * Must be called once at app startup (typically in main.tsx or entry point).
 *
 * @module mocks/browser
 * @see src/mocks/server.ts - Test server initialization
 * @see src/shared/api/http-client.ts - Axios client setup
 */

import { setupWorker } from 'msw/browser'
import type { RequestHandler } from 'msw'
import type { MockState } from './state/mock-state'
import { getMockState, setMockState, resetToScenario } from './state/mock-state'

/** MSW worker instance for browser development */
let worker: ReturnType<typeof setupWorker> | null = null

/** Whether the worker has finished starting */
let running = false

/**
 * Initialize MSW for browser development.
 *
 * @param options - Optional configuration
 * @param options.enabled - Whether MSW is enabled (defaults to true)
 * @returns Resolves once the worker is active (or immediately when disabled)
 */
export function initializeMswBrowser(options: { enabled?: boolean } = {}): Promise<void> {
  const enabled = options.enabled ?? process.env.MOCK_MODE !== 'false'

  if (!enabled) {
    return Promise.resolve()
  }

  return import('./handlers/index')
    .then(({ handlers }) => {
      worker = setupWorker(...handlers)
      return worker.start({ quiet: true, onUnhandledFrame: 'bypass' })
    })
    .then(
      () => {
        running = true
      },
      (error: unknown) => {
        running = false
        throw error
      }
    )
}

/**
 * Reset mock state to initial fixtures.
 *
 * @param state - Optional partial state to reset to
 */
export function resetMockState(state: Partial<MockState> = {}): void {
  resetToScenario(state)
}

export { getMockState, setMockState }

/**
 * Check if MSW is currently active.
 *
 * @returns boolean indicating if MSW mock mode is active
 */
export function isMswActive(): boolean {
  return !!worker && running
}

/**
 * Manual MSW worker control for test scenarios.
 *
 * @param handler - MSW request handler to add/remove
 * @param action - 'add' or 'remove'
 */
export function controlMsw(handler: RequestHandler, action: 'add' | 'remove'): void {
  if (action === 'add') {
    worker?.use(handler)
  } else {
    worker?.resetHandlers()
  }
}

/** Default export for convenience */
export default {
  initializeMswBrowser,
  resetMockState,
  isMswActive,
  controlMsw,
  getMockState,
  setMockState
}
