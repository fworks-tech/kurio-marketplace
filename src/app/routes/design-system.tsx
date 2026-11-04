import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'

const DesignSystemPreview = React.lazy(() => import('@/features/design-system/preview'))

export const Route = createFileRoute('/design-system')({
  head: () => ({ meta: [{ name: 'robots', content: 'noindex' }] }),
  component: () => (
    <React.Suspense fallback={<p className="text-muted-foreground p-6">Carregando…</p>}>
      <DesignSystemPreview />
    </React.Suspense>
  )
})
