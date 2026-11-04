import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { CatalogScreen } from '@/features/catalog/catalog-screen'
import type { CatalogState } from '@/features/catalog/catalog-queries'
import { AuthModal } from './auth-modal'
import { MobileAuthPage } from './mobile-auth-page'

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

/** `Mobile / Login` and `Mobile / Cadastro` are full pages; the dialog is desktop only. */
function useIsDesktop(): boolean {
  const [desktop, setDesktop] = useState(() =>
    typeof window === 'undefined' ? true : window.matchMedia('(min-width: 1024px)').matches
  )
  useEffect(() => {
    const query = window.matchMedia('(min-width: 1024px)')
    const listener = (event: MediaQueryListEvent) => setDesktop(event.matches)
    setDesktop(query.matches)
    query.addEventListener('change', listener)
    return () => query.removeEventListener('change', listener)
  }, [])
  return desktop
}

/** Login/signup render as the auth modal over the real home page, exactly as in the Figma frame. */
export function AuthRoute({ mode, redirect }: AuthRouteProps) {
  const navigate = useNavigate()
  const desktop = useIsDesktop()
  const destination = (redirect || '/') as '/'

  if (!desktop) {
    return <MobileAuthPage mode={mode} onAuthenticated={() => navigate({ to: destination })} />
  }

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
