import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from './skeleton'
import { useAuthDialog } from '@/features/auth/auth-dialog'

interface RequireAuthProps {
  loading?: boolean
  authenticated: boolean
  children: ReactNode
  fallback?: ReactNode
  /** Render the sign-in prompt as a page landmark (used by full-page routes). */
  landmark?: boolean
}

export function RequireAuth({
  loading,
  authenticated,
  children,
  fallback,
  landmark = false
}: RequireAuthProps) {
  const { openAuth } = useAuthDialog()

  if (loading) {
    return <Skeleton className="h-24 w-full" label="Verificando sessão" />
  }

  if (authenticated) return <>{children}</>

  if (fallback) return <>{fallback}</>

  const prompt = (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <p className="font-semibold">Você precisa estar conectado.</p>
      <Button onClick={() => openAuth('login')}>Entrar</Button>
    </div>
  )

  if (!landmark) return prompt

  return <main className="mx-auto max-w-[1248px] px-4 py-8 sm:px-6">{prompt}</main>
}
