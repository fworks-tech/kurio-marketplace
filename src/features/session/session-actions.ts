import { clearSessionCaches } from '@/shared/lib/query-client'
import { disconnectRealtime } from '@/app/realtime'
import { authService } from '@/shared/services'

/** Ends the session and releases every piece of state owned by it */
export async function endSession(): Promise<void> {
  try {
    await authService.logout()
  } finally {
    disconnectRealtime()
    clearSessionCaches()
  }
}
