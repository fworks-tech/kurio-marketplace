import { ApiError } from '@/shared/api/api-error'
import { connectRealtime } from '@/app/realtime'
import type { AuthSession } from '@/shared/api/api-types'
import type { QueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/shared/lib/query-client'

export interface AuthFieldErrors {
  general?: string
  fields: Record<string, string>
}

/** Collapse the API's per-field error lists into one message per field for form display. */
export function toFieldErrors(error: unknown): AuthFieldErrors {
  if (error instanceof ApiError) {
    const fields: Record<string, string> = {}
    for (const [field, messages] of Object.entries(error.fieldErrors ?? {})) {
      if (messages[0]) fields[field] = messages[0]
    }
    const general = Object.keys(fields).length > 0 ? undefined : error.message
    return { general, fields }
  }
  return { general: 'Algo deu errado. Tente novamente.', fields: {} }
}

/** Write the authenticated session into the query cache so `useSession` flips to signed-in. */
export function storeSession(queryClient: QueryClient, session: AuthSession): void {
  queryClient.setQueryData(queryKeys.session, session)
  // Order events are scoped to the session, so the socket re-subscribes with the user id.
  void connectRealtime(session.user.id)
}
