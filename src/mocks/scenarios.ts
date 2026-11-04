/**
 * Deterministic failure scenarios for the mock backend.
 *
 * A scenario can be selected per request with the `x-mock-scenario` header or
 * globally with `setScenario()`. Built-in names cover the documented failure
 * matrix; tests may register their own with `defineScenario()`.
 */

import type { ApiErrorResponse } from '../shared/api/api-types'

export interface MockScenario {
  latencyMs?: number
  latenciesMs?: number[]
  status?: number
  code?: string
  message?: string
  errorType?: ApiErrorResponse['error']['type']
  networkError?: boolean
}

const BUILT_IN_SCENARIOS: Record<string, MockScenario> = {
  slow: { latencyMs: 750 },
  timeout: {
    latencyMs: 100,
    status: 504,
    code: 'ORDER_TIMEOUT',
    message: 'The request timed out. Please try again.',
    errorType: 'server_error'
  },
  'network-failure': { networkError: true },
  'http-400': { status: 400, code: 'VALIDATION_ERROR', errorType: 'validation' },
  'http-401': { status: 401, code: 'UNAUTHORIZED', errorType: 'unauthorized' },
  'http-403': { status: 403, code: 'FORBIDDEN', errorType: 'forbidden' },
  'http-404': { status: 404, code: 'NOT_FOUND', errorType: 'not_found' },
  'http-409': { status: 409, code: 'CONFLICT', errorType: 'conflict' },
  'http-500': { status: 500, code: 'INTERNAL_ERROR', errorType: 'server_error' },
  'session-expired': {
    status: 401,
    code: 'SESSION_EXPIRED',
    message: 'Your session has expired. Please log in again.',
    errorType: 'unauthorized'
  },
  'payment-rejected': {
    status: 402,
    code: 'PAYMENT_REJECTED',
    message: 'Payment was rejected. Please try again.',
    errorType: 'validation'
  },
  'invalid-coupon': {
    status: 400,
    code: 'INVALID_COUPON',
    message: 'The coupon code is invalid.',
    errorType: 'validation'
  },
  'expired-coupon': {
    status: 410,
    code: 'EXPIRED_COUPON',
    message: 'This coupon has expired.',
    errorType: 'validation'
  },
  'price-changed': {
    status: 409,
    code: 'PRICE_CHANGED',
    message: 'The price has changed. Please review your cart.',
    errorType: 'conflict'
  },
  'sold-out': {
    status: 409,
    code: 'OUT_OF_STOCK',
    message: 'This NFT is no longer available.',
    errorType: 'conflict'
  },
  'idempotency-conflict': {
    status: 409,
    code: 'IDEMPOTENCY_CONFLICT',
    message: 'A request with this key already exists with different payload.',
    errorType: 'conflict'
  },
  'out-of-order': { latenciesMs: [300, 0] }
}

export const SCENARIO_HEADER = 'x-mock-scenario'

let scenarios = new Map<string, MockScenario>(Object.entries(BUILT_IN_SCENARIOS))
let activeScenario: string | null = null
const latencyCursors = new Map<string, number>()

/** Register or replace a named scenario */
export function defineScenario(name: string, scenario: MockScenario): void {
  scenarios.set(name, scenario)
}

/** Select a scenario for every subsequent request */
export function setScenario(name: string | null): void {
  activeScenario = name
}

/** Read a scenario by name */
export function getScenario(name: string): MockScenario | undefined {
  return scenarios.get(name)
}

/** Restore built-ins and clear the active selection */
export function resetScenarios(): void {
  scenarios = new Map<string, MockScenario>(Object.entries(BUILT_IN_SCENARIOS))
  activeScenario = null
  latencyCursors.clear()
}

/** Resolve the scenario for a request, header first, global fallback second */
export function resolveScenario(headers: Headers): { name: string; scenario: MockScenario } | null {
  const name = headers.get(SCENARIO_HEADER) ?? activeScenario
  if (!name) return null
  const scenario = scenarios.get(name)
  return scenario ? { name, scenario } : null
}

/** Pick the latency for this request, cycling through a sequence if provided */
export function nextLatency(name: string, scenario: MockScenario): number {
  if (!scenario.latenciesMs?.length) return scenario.latencyMs ?? 0
  const cursor = latencyCursors.get(name) ?? 0
  latencyCursors.set(name, cursor + 1)
  return scenario.latenciesMs[cursor % scenario.latenciesMs.length] ?? 0
}

/** Build the standard error envelope for a scenario */
export function scenarioError(name: string, scenario: MockScenario): ApiErrorResponse {
  const type = scenario.errorType ?? 'server_error'
  return {
    success: false,
    error: {
      code: scenario.code ?? 'INTERNAL_ERROR',
      message: scenario.message ?? `Simulated ${type} failure (${name}).`,
      type
    },
    timestamp: new Date().toISOString(),
    requestId: `req-${Date.now()}`
  }
}
