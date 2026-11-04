import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import './app.css'
import { router } from './router'
import { queryClient } from '@/shared/lib/query-client'
import { initializeMswBrowser } from '@/mocks/browser'
import { activateMocks } from '@/mocks/activate'
import { connectRealtime } from '@/app/realtime'
import { useSession } from '@/features/session/session-queries'
import { LiveRegionProvider } from '@/shared/ui/live-region'
import { Toaster } from '@/components/ui/sonner'

/**
 * Bind the realtime socket to the authenticated session.
 *
 * A refresh restores the session through the query cache, not through the login
 * mutation, so the subscription has to follow `useSession` instead of only the
 * sign-in action; otherwise user-scoped events (order status) are filtered out
 * for every reloaded page.
 */
function RealtimeSessionBridge(): null {
  const { data: session } = useSession()
  const userId = session?.user.id ?? null

  useEffect(() => {
    void connectRealtime(userId)
  }, [userId])

  return null
}

async function bootstrap(): Promise<void> {
  await initializeMswBrowser()
  const scenario = activateMocks()
  if (scenario) {
    // eslint-disable-next-line no-console -- developer affordance
    console.info(`[mocks] scenario "${scenario}" active`)
  }
  void connectRealtime(null)
  const container = document.getElementById('root')
  if (!container) {
    throw new Error('Missing #root container')
  }
  createRoot(container).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <LiveRegionProvider>
          <RealtimeSessionBridge />
          <RouterProvider router={router} />
          <Toaster />
        </LiveRegionProvider>
      </QueryClientProvider>
    </StrictMode>
  )
}

void bootstrap()
