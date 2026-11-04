import { redirect } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { getSessionQueryOptions } from '@/features/session/session-queries'

export function isInternalPath(path: string): boolean {
  return /^\/(?!\/)/.test(path)
}

export async function requireSession(queryClient: QueryClient, from: string): Promise<void> {
  const session = await queryClient.ensureQueryData(getSessionQueryOptions())
  if (!session) {
    throw redirect({ to: '/login', search: { redirect: from } })
  }
}
