/**
 * Shared Axios client for the NFT Marketplace.
 *
 * - One configured instance for every service
 * - Auth token injection outside mock mode
 * - Success payload unwrapping
 * - Consistent ApiError normalization
 */

import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'
import type { RequestHandler } from 'msw'
import type { ZodType } from 'zod'
import { ApiError, normalizeApiError, ErrorCode } from './api-error'
import type { ApiResponse } from './api-types'

/** Raised when a response fails its declared boundary schema */
function invalidResponse(detail: string): ApiError {
  return new ApiError('Invalid API response.', {
    code: ErrorCode.InternalError,
    status: 500,
    type: 'server_error',
    cause: detail
  })
}

const MOCK_MODE = process.env.MOCK_MODE === 'true' || process.env.MOCK_MODE === ''

export const API_BASE_URL = process.env.API_BASE_URL ?? '/api'

/**
 * Create a configured Axios instance.
 *
 * @param baseUrl - API base URL (defaults to `/api`)
 */
export function createHttpClient(baseUrl: string = API_BASE_URL): AxiosInstance {
  const client = axios.create({
    baseURL: baseUrl,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    }
  })

  client.interceptors.request.use((config) => {
    if (MOCK_MODE) return config

    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  return client
}

/** Shared Axios instance used by all API services */
export const api: AxiosInstance = createHttpClient()

/**
 * Perform a request and unwrap the standard API envelope.
 *
 * Every failure is normalized to `ApiError`. When a `schema` is supplied the
 * unwrapped payload is validated against it at the network boundary; a
 * malformed response becomes an `ApiError` instead of leaking bad data inward.
 *
 * @param config - Axios request configuration
 * @param schema - Optional boundary schema for the unwrapped payload
 */
export async function request<T>(
  config: AxiosRequestConfig,
  schema?: ZodType<T>
): Promise<T> {
  try {
    const response = await api.request<ApiResponse<T>>(config)
    const data = response.data.data
    if (!schema) return data
    const parsed = schema.safeParse(data)
    if (!parsed.success) throw invalidResponse(parsed.error.message)
    return parsed.data
  } catch (error) {
    throw normalizeApiError(error)
  }
}

/** Paginated payload plus the response metadata */
export interface PageResult<T> {
  data: T[]
  meta: ApiResponse<T[]>['meta']
}

/**
 * Perform a paginated request and keep the metadata.
 *
 * @param config - Axios request configuration
 * @param itemSchema - Optional boundary schema applied to each page item
 */
export async function requestPage<T>(
  config: AxiosRequestConfig,
  itemSchema?: ZodType<T>
): Promise<PageResult<T>> {
  try {
    const response = await api.request<ApiResponse<T[]>>(config)
    const raw = response.data.data
    let data = raw
    if (itemSchema) {
      const checked: T[] = []
      for (const item of raw) {
        const parsed = itemSchema.safeParse(item)
        if (!parsed.success) throw invalidResponse(parsed.error.message)
        checked.push(parsed.data)
      }
      data = checked
    }
    return { data, meta: response.data.meta }
  } catch (error) {
    throw normalizeApiError(error)
  }
}

/** Generate an idempotency key for order mutations */
export function generateIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `idem-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

/**
 * Mark the client as mock-backed. Kept for the documented browser entry point.
 */
export function initializeMsw(_handler: RequestHandler): void {
  if (typeof window !== 'undefined') {
    ;(api.defaults as unknown as { mockMode: boolean }).mockMode = true
  }
}
