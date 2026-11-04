/**
 * MSW server instance for automated tests.
 *
 * Provides a programmatic MSW server that can be used in Vitest test files.
 * Enables MSW initialization in automated tests without a browser environment.
 *
 * @module mocks/server
 * @see src/mocks/browser.ts - Browser development initialization
 * @see src/mocks/handlers/index.ts - Request handlers
 * @see src/mocks/state/mock-state.ts - Centralized mock state
 */

import { setupServer } from 'msw/node'
import { handlers } from './handlers/index'
import type { MockState } from './state/mock-state'
import { getMockState, resetMockState, setMockState } from './state/mock-state'

/** MSW server instance exported for test usage */
export const server = setupServer(...handlers)

/** Whether the test server is currently listening */
let listening = false

/**
 * Start the test server.
 */
export function startServer(options?: Parameters<typeof server.listen>[0]): void {
  server.listen(options)
  listening = true
}

/**
 * Stop the test server.
 */
export function stopServer(): void {
  server.close()
  listening = false
}

/**
 * Reset mock state before each test.
 *
 * Ensures test isolation by resetting all mock state to initial fixtures.
 */
export function resetTestMockState(): MockState {
  resetMockState()
  return getMockState()
}

/**
 * Check if server is listening.
 *
 * @returns boolean indicating if MSW server is active
 */
export function isServerActive(): boolean {
  return listening
}

/**
 * Get base URL for MSW handlers.
 *
 * @returns The base URL that MSW handlers are mounted on
 */
export function getBaseUrl(): string {
  return '/api'
}

export {
  getMockState as getTestMockState,
  resetMockState,
  setMockState as setTestMockState
}

/**
 * Export mock state utilities for use in tests.
 */
export const mockStateUtils = {
  getTestMockState: getMockState,
  resetMockState,
  resetTestMockState,
  setTestMockState: setMockState
}

/**
 * Default export for convenience in test files.
 */
export default {
  server,
  startServer,
  stopServer,
  resetMockState,
  resetTestMockState,
  isServerActive,
  getBaseUrl,
  getTestMockState: getMockState,
  setTestMockState: setMockState,
  mockStateUtils
}
