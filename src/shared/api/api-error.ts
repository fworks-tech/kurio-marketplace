/**
 * Shared API error types for the NFT Marketplace.
 *
 * Centralized error definitions ensuring consistent error handling
 * across the application, mock handlers, and test scenarios.
 *
 * @module shared/api
 * @see src/shared/api/api-types
 */

import type { ApiErrorResponse } from './api-types'

/** HTTP error codes used throughout the API */
export enum HttpStatusCode {
  BadRequest = 400,
  Unauthorized = 401,
  Forbidden = 403,
  NotFound = 404,
  Conflict = 409,
  Gone = 410,
  UnprocessableEntity = 422,
  InternalServerError = 500
}

/** Error codes for API error responses */
export enum ErrorCode {
  ValidationFailed = 'VALIDATION_ERROR',
  DuplicateEmail = 'DUPLICATE_EMAIL',
  InvalidCredentials = 'INVALID_CREDENTIALS',
  SessionExpired = 'SESSION_EXPIRED',
  NotAuthenticated = 'UNAUTHORIZED',
  Forbidden = 'FORBIDDEN',
  Conflict = 'CONFLICT',
  ResourceNotFound = 'NOT_FOUND',
  ItemAlreadyFavorite = 'ITEM_ALREADY_FAVORITE',
  ItemNotAvailable = 'OUT_OF_STOCK',
  CouponInvalid = 'INVALID_COUPON',
  CouponExpired = 'EXPIRED_COUPON',
  QuoteExpired = 'QUOTE_EXPIRED',
  PriceChanged = 'PRICE_CHANGED',
  ItemSoldOut = 'ITEM_SOLD_OUT',
  PaymentRejected = 'PAYMENT_REJECTED',
  OrderTimeout = 'ORDER_TIMEOUT',
  IdempotencyKeyConflict = 'IDEMPOTENCY_CONFLICT',
  PayloadMismatch = 'PAYLOAD_MISMATCH',
  NetworkError = 'NETWORK_ERROR',
  TimeoutError = 'TIMEOUT',
  InternalError = 'INTERNAL_ERROR'
}

/** Validation error field mapping */
export interface ValidationError {
  field: string
  message: string
  code?: string
}

/** Batch of validation errors indexed by field name */
export interface ValidationErrors {
  [key: string]: ValidationError
}

/** Axios error type for consistent error handling */
export interface AxiosApiError extends Error {
  response: {
    status: HttpStatusCode
    data: ApiErrorResponse
  }
  isAxiosError: boolean
  toJSON: () => {
    message: string
    name: string
    status: number
    error: string
    response: {
      status: number
      data: ApiErrorResponse
    }
  }
}

/** Error boundary state for React error boundaries */
export interface ErrorBoundaryState {
  hasError: boolean
  error: Error | ApiErrorResponse
  reset: () => void
}

/** User-facing error messages mapped from error codes */
export const errorMessages: Record<ErrorCode, string> = {
  [ErrorCode.ValidationFailed]: 'Please check the form for errors.',
  [ErrorCode.DuplicateEmail]: 'This email is already registered.',
  [ErrorCode.InvalidCredentials]: 'Invalid email or password.',
  [ErrorCode.SessionExpired]: 'Your session has expired. Please log in again.',
  [ErrorCode.NotAuthenticated]: 'You are not authorized to perform this action.',
  [ErrorCode.Forbidden]: 'You do not have permission to perform this action.',
  [ErrorCode.Conflict]: 'This request conflicts with the current state.',
  [ErrorCode.ResourceNotFound]: 'The requested resource could not be found.',
  [ErrorCode.ItemAlreadyFavorite]: 'This NFT is already in your favorites.',
  [ErrorCode.ItemNotAvailable]: 'This NFT is no longer available.',
  [ErrorCode.CouponInvalid]: 'The coupon code is invalid.',
  [ErrorCode.CouponExpired]: 'This coupon has expired.',
  [ErrorCode.QuoteExpired]: 'This quote has expired. Request a new one.',
  [ErrorCode.PriceChanged]: 'The price has changed. Please review your cart.',
  [ErrorCode.ItemSoldOut]: 'This NFT is now sold out.',
  [ErrorCode.PaymentRejected]: 'Payment was rejected. Please try again.',
  [ErrorCode.OrderTimeout]: 'The order timed out. Please try again.',
  [ErrorCode.IdempotencyKeyConflict]: 'A request with this key already exists.',
  [ErrorCode.PayloadMismatch]: 'The request payload does not match the original.',
  [ErrorCode.NetworkError]: 'Network error. Please check your connection.',
  [ErrorCode.TimeoutError]: 'The request timed out. Please try again.',
  [ErrorCode.InternalError]: 'An unexpected error occurred. Please try again.'
}

/** Normalized error raised by the shared API client */
export class ApiError extends Error {
  readonly code: string
  readonly status: number
  readonly type: ApiErrorResponse['error']['type'] | 'network' | 'timeout'
  readonly fieldErrors?: Record<string, string[]>
  readonly requestId?: string

  constructor(
    message: string,
    options: {
      code: string
      status: number
      type: ApiErrorResponse['error']['type'] | 'network' | 'timeout'
      fieldErrors?: Record<string, string[]>
      requestId?: string
      cause?: unknown
    }
  ) {
    super(message, { cause: options.cause })
    this.name = 'ApiError'
    this.code = options.code
    this.status = options.status
    this.type = options.type
    this.fieldErrors = options.fieldErrors
    this.requestId = options.requestId
  }
}

/**
 * Normalize any thrown value into an ApiError.
 *
 * API envelopes keep their documented code and field errors; transport
 * failures become NETWORK_ERROR or TIMEOUT with no HTTP status.
 */
export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error

  const axiosError = error as Partial<AxiosApiError> & {
    code?: string
    message?: string
  }

  if (axiosError?.response?.data?.error) {
    const { data, status } = axiosError.response
    const code = data.error.code || ErrorCode.InternalError
    return new ApiError(
      data.error.message || errorMessages[code as ErrorCode] || 'Unexpected error',
      {
        code,
        status,
        type: data.error.type,
        fieldErrors: data.error.fieldErrors,
        requestId: data.requestId,
        cause: error
      }
    )
  }

  if (axiosError?.code === 'ECONNABORTED' || axiosError?.code === 'ETIMEDOUT') {
    return new ApiError(errorMessages[ErrorCode.TimeoutError], {
      code: ErrorCode.TimeoutError,
      status: 0,
      type: 'timeout',
      cause: error
    })
  }

  return new ApiError(errorMessages[ErrorCode.NetworkError], {
    code: ErrorCode.NetworkError,
    status: 0,
    type: 'network',
    cause: error
  })
}

/** Back-compat helper that throws a normalized error */
export function handleApiError(error: unknown): never {
  throw normalizeApiError(error)
}

/** Check if error matches a specific error code */
export function isErrorCode(error: unknown, code: ErrorCode): boolean {
  return error instanceof ApiError
    ? error.code === code
    : (error as AxiosApiError)?.response?.data?.error?.code === code
}