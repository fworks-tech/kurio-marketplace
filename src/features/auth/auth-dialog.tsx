import { createContext, useContext, useState, type ReactNode } from 'react'
import { AuthModal } from './auth-modal'

export type AuthMode = 'login' | 'signup'

interface AuthDialogValue {
  openAuth: (mode?: AuthMode) => void
}

const AuthDialogContext = createContext<AuthDialogValue>({ openAuth: () => undefined })

export function useAuthDialog() {
  return useContext(AuthDialogContext)
}

/** Single app-wide auth dialog: opening it never changes the route or the page behind it. */
export function AuthDialogProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AuthMode | null>(null)

  const openAuth = (next: AuthMode = 'login') => setMode(next)
  const close = (open: boolean) => {
    if (!open) setMode(null)
  }

  return (
    <AuthDialogContext.Provider value={{ openAuth }}>
      {children}
      <AuthModal
        open={mode !== null}
        mode={mode ?? 'login'}
        onOpenChange={close}
        onAuthenticated={() => setMode(null)}
      />
    </AuthDialogContext.Provider>
  )
}
