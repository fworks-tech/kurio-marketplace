import { createFileRoute } from '@tanstack/react-router'
import CatalogPreview from '@/features/catalog/preview'

export const Route = createFileRoute('/components')({
  head: () => ({ meta: [{ name: 'robots', content: 'noindex' }] }),
  component: CatalogPreview
})
