import { useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { endSession } from './session-actions'

/**
 * Sign out and leave the pages that require a session.
 *
 * Clearing the caches signs the shell out, but the account frames are guarded by
 * `beforeLoad`, which only runs on navigation: without this the profile page would
 * stay open on a session that no longer exists.
 */
export function useSignOut(): () => void {
  const navigate = useNavigate()
  return useCallback(() => {
    void (async () => {
      await endSession()
      await navigate({ to: '/', replace: true })
    })()
  }, [navigate])
}
