/**
 * Thin MSW 2 adapter for the existing handler style.
 *
 * The handler bodies use the MSW 1 `res`/`ctx`/`req` shape. This module keeps
 * that shape while running on MSW 2, and applies deterministic scenarios
 * before any handler executes.
 */

import { delay, http, HttpResponse } from 'msw'
import type { JsonBodyType, PathParams } from 'msw'
import { nextLatency, resolveScenario, scenarioError } from './scenarios'

interface JsonPart {
  kind: 'json'
  body: JsonBodyType
}

interface StatusPart {
  kind: 'status'
  status: number
}

export const ctx = {
  json<T>(body: T): JsonPart {
    return { kind: 'json', body: body as JsonBodyType }
  },
  status(status: number): StatusPart {
    return { kind: 'status', status }
  }
}

/** Build an MSW 2 response from the MSW 1-style parts */
export function res(...parts: Array<JsonPart | StatusPart>): Response {
  const status = parts.find((part): part is StatusPart => part.kind === 'status')?.status ?? 200
  const json = parts.find((part): part is JsonPart => part.kind === 'json')
  return json ? HttpResponse.json(json.body, { status }) : new HttpResponse(null, { status })
}

export interface CompatRequest {
  url: URL
  params: PathParams
  headers: Headers
  json<T>(): Promise<T>
}

type CompatResolver = (
  req: CompatRequest,
  response: typeof res,
  context: typeof ctx
) => Response | Promise<Response>

async function run(request: Request, params: PathParams, resolver: CompatResolver) {
  const selected = resolveScenario(request.headers)

  if (selected) {
    if (selected.scenario.networkError) {
      return HttpResponse.error()
    }

    const latency = nextLatency(selected.name, selected.scenario)
    if (latency > 0) {
      await delay(latency)
    }

    if (selected.scenario.status) {
      return HttpResponse.json(scenarioError(selected.name, selected.scenario), {
        status: selected.scenario.status
      })
    }
  }

  const compatRequest: CompatRequest = {
    url: new URL(request.url),
    params,
    headers: request.headers,
    json: <T>() => request.json() as Promise<T>
  }
  return resolver(compatRequest, res, ctx)
}

function route(method: 'get' | 'post' | 'patch' | 'delete' | 'all', path: string, resolver: CompatResolver) {
  return http[method](path, ({ request, params }) => run(request, params, resolver))
}

/** MSW 1-style route facade backed by MSW 2 */
export const rest = {
  get: (path: string, resolver: CompatResolver) => route('get', path, resolver),
  post: (path: string, resolver: CompatResolver) => route('post', path, resolver),
  patch: (path: string, resolver: CompatResolver) => route('patch', path, resolver),
  delete: (path: string, resolver: CompatResolver) => route('delete', path, resolver),
  all: (path: string, resolver: CompatResolver) => route('all', path, resolver)
}
