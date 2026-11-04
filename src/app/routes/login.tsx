import { createFileRoute } from '@tanstack/react-router'
import { AuthRoute } from '@/features/auth/auth-route'
import { isInternalPath } from '@/app/auth-guard'

interface LoginSearch {
  redirect: string
}

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    redirect:
      typeof search.redirect === 'string' && isInternalPath(search.redirect)
        ? search.redirect
        : '/'
  }),
  component: () => <AuthRoute mode="login" redirect={Route.useSearch().redirect} />
})
