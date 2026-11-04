import { createFileRoute } from '@tanstack/react-router'
import { AuthRoute } from '@/features/auth/auth-route'
import { isInternalPath } from '@/app/auth-guard'

interface SignupSearch {
  redirect: string
}

export const Route = createFileRoute('/signup')({
  validateSearch: (search: Record<string, unknown>): SignupSearch => ({
    redirect:
      typeof search.redirect === 'string' && isInternalPath(search.redirect)
        ? search.redirect
        : '/'
  }),
  component: () => <AuthRoute mode="signup" redirect={Route.useSearch().redirect} />
})
