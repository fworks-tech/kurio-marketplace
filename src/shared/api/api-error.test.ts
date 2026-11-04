import { describe, expect, it } from 'vitest'
import {
  ApiError,
  ErrorCode,
  isErrorCode,
  normalizeApiError
} from './api-error'
import type { ApiErrorResponse } from './api-types'

function envelope(overrides: Partial<ApiErrorResponse['error']> = {}): ApiErrorResponse {
  return {
    success: false,
    error: {
      code: ErrorCode.ValidationFailed,
      message: 'Invalid input.',
      type: 'validation',
      fieldErrors: { email: ['Required'] },
      ...overrides
    },
    timestamp: new Date().toISOString(),
    requestId: 'req-test'
  }
}

describe('api error normalization', () => {
  it('keeps the documented error code, status, and field errors', () => {
    const normalized = normalizeApiError({
      response: { status: 400, data: envelope() }
    })

    expect(normalized).toBeInstanceOf(ApiError)
    expect(normalized.code).toBe('VALIDATION_ERROR')
    expect(normalized.status).toBe(400)
    expect(normalized.type).toBe('validation')
    expect(normalized.fieldErrors).toEqual({ email: ['Required'] })
    expect(normalized.requestId).toBe('req-test')
  })

  it('maps timeouts and missing responses to transport errors', () => {
    const timeout = normalizeApiError({ code: 'ECONNABORTED' })
    expect(timeout.code).toBe('TIMEOUT')
    expect(timeout.status).toBe(0)

    const network = normalizeApiError(new Error('boom'))
    expect(network.code).toBe('NETWORK_ERROR')
    expect(network.type).toBe('network')
  })

  it('passes normalized errors through and matches codes', () => {
    const original = new ApiError('Conflict', {
      code: ErrorCode.IdempotencyKeyConflict,
      status: 409,
      type: 'conflict'
    })

    expect(normalizeApiError(original)).toBe(original)
    expect(isErrorCode(original, ErrorCode.IdempotencyKeyConflict)).toBe(true)
    expect(isErrorCode(original, ErrorCode.ValidationFailed)).toBe(false)
  })
})
