import { useNavigate } from '@tanstack/react-router'
import { CatalogScreen } from '@/features/catalog/catalog-screen'
import type { CatalogState } from '@/features/catalog/catalog-queries'
import { AuthModal } from './auth-modal'

const BACKDROP_STATE: CatalogState = {
  search: '',
  sort: 'newest',
  tab: 'todos',
  page: 1
}

interface AuthRouteProps {
  mode: 'login' | 'signup'
  redirect: string
}

/** Login/signup render as the auth modal over the real home page, exactly as in the Figma frame. */
export function AuthRoute({ mode, redirect }: AuthRouteProps) {
  const navigate = useNavigate()
  const destination = (redirect || '/') as '/'
  return (
    <>
      <div aria-hidden className="pointer-events-none select-none">
        <CatalogScreen state={BACKDROP_STATE} onPatch={() => undefined} onRequireAuth={() => undefined} />
      </div>
      <AuthModal
        open
        mode={mode}
        onOpenChange={(open) => {
          if (!open) navigate({ to: destination })
        }}
        onAuthenticated={() => navigate({ to: destination })}
      />
    </>
  )
}
