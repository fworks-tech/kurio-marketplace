import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import './app.css'
import { router } from './router'
import { queryClient } from '@/shared/lib/query-client'
import { initializeMswBrowser } from '@/mocks/browser'
import { activateMocks } from '@/mocks/activate'
import { connectRealtime } from '@/app/realtime'
import { LiveRegionProvider } from '@/shared/ui/live-region'
import { Toaster } from '@/components/ui/sonner'

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
          <RouterProvider router={router} />
          <Toaster />
        </LiveRegionProvider>
      </QueryClientProvider>
    </StrictMode>
  )
}

void bootstrap()
