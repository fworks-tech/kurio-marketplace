import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'

interface AuthLayoutProps {
  title: string
  description?: string
  children: ReactNode
}

/** Shared frame for login and signup: wordmark, heading and content card. */
export function AuthLayout({ title, description, children }: AuthLayoutProps) {
  return (
    <main className="bg-bg flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="bg-surface-card w-full max-w-md space-y-6 rounded-card border border-white/10 p-6 sm:p-8">
        <div className="space-y-1 text-center">
          <Link to="/" className="text-2xl font-extrabold tracking-tight">
            Kurio
          </Link>
          <h1 className="text-xl font-bold">{title}</h1>
          {description ? <p className="text-text-secondary text-sm">{description}</p> : null}
        </div>
        {children}
      </div>
    </main>
  )
}
