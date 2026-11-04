/**
 * Browser-side mock activation and scenario control.
 *
 * The scenario switch is reproducible and survives refresh: a name can be set
 * with the `?mockScenario=` query string (which then persists to storage) or
 * restored from storage on load. `window.__mocks` is the documented equivalent
 * of the `mocks:reset` script — mock state lives in the browser's localStorage,
 * so it is reset from the running app, not from a CLI.
 */

import { setScenario, getScenario, resetScenarios } from './scenarios'
import { resetMockState, getMockState } from './state/mock-state'

export const SCENARIO_QUERY_PARAM = 'mockScenario'
export const SCENARIO_STORAGE_KEY = 'nft-mock-scenario'

declare global {
  interface Window {
    __mocks?: MockHelpers
  }
}

export interface MockHelpers {
  setScenario(name: string | null): void
  scenario(): string | null
  reset(): void
  describe(name: string): unknown
}

function readStoredScenario(): string | null {
  try {
    return window.localStorage.getItem(SCENARIO_STORAGE_KEY)
  } catch {
    return null
  }
}

function persistScenario(name: string | null): void {
  try {
    if (name) {
      window.localStorage.setItem(SCENARIO_STORAGE_KEY, name)
    } else {
      window.localStorage.removeItem(SCENARIO_STORAGE_KEY)
    }
  } catch {
    // storage disabled (private mode): scenario still applies for this session
  }
}

function readQueryScenario(): string | null {
  return new URLSearchParams(window.location.search).get(SCENARIO_QUERY_PARAM)
}

/** Apply the active scenario and install the window helpers. Returns the name used. */
export function activateMocks(): string | null {
  const query = readQueryScenario()
  const name = query ?? readStoredScenario()
  if (name && getScenario(name)) {
    setScenario(name)
    persistScenario(name)
  }

  window.__mocks = {
    setScenario: (next) => {
      const valid = next && !getScenario(next)
      if (valid) {
        // eslint-disable-next-line no-console -- developer affordance
        console.warn(`[mocks] unknown scenario "${next}"`)
      }
      setScenario(next ?? null)
      persistScenario(getScenario(next ?? '') ? next : null)
    },
    scenario: () => readQueryScenario() ?? readStoredScenario(),
    reset: () => {
      resetMockState()
      resetScenarios()
      persistScenario(null)
    },
    describe: () => getMockState()
  }

  return name && getScenario(name) ? name : null
}
