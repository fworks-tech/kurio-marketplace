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
// The mock API answers in English; the product copy is Portuguese.
const SERVER_MESSAGE: Record<string, string> = {
  'Username must be at least 3 characters.': 'O usuário precisa ter ao menos 3 caracteres.',
  'Enter a valid email address.': 'Informe um e-mail válido.',
  'Password must be at least 8 characters.': 'A senha precisa ter ao menos 8 caracteres.',
  'This email is already registered.': 'Este e-mail já está cadastrado.',
  'Invalid email or password.': 'E-mail ou senha inválidos.'
}

function translate(message: string): string {
  return SERVER_MESSAGE[message] ?? message
}

export function toFieldErrors(error: unknown): AuthFieldErrors {
  if (error instanceof ApiError) {
    const fields: Record<string, string> = {}
    for (const [field, messages] of Object.entries(error.fieldErrors ?? {})) {
      if (messages[0]) fields[field] = translate(messages[0])
    }
    const general = Object.keys(fields).length > 0 ? undefined : translate(error.message)
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
