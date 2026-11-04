import { cn } from '@/lib/utils'

type MarkProps = { className?: string }

/* Brand marks are assets, not theme tokens. Google/Facebook glyphs inline so the
 * login and signup screens never fetch an external logo. Wallet marks (MetaMask,
 * Coinbase, Brave, Trust, Safe) are deferred to the wallet flow task. */

export function GoogleMark({ className }: MarkProps) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 48 48"
      className={cn('size-5', className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="#4285F4"
        d="M45.1 24.5c0-1.6-.1-3.1-.4-4.6H24v8.7h11.8c-.5 2.8-2.1 5.1-4.4 6.7v5.5h7.1c4.1-3.8 6.5-9.4 6.5-16z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.9 0 10.8-2 14.4-5.4l-7.1-3.5c-2 1.3-4.5 2.1-7.3 2.1-5.6 0-10.4-3.8-12.1-8.9H4.6v5.7C8.2 42.9 15.6 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.9 28.3c-.4-1.3-.7-2.7-.7-4.3s.3-3 .7-4.3v-5.7H4.6C3.2 16.9 2.4 20.3 2.4 24s.8 7.1 2.2 10.2l7.3-5.9z"
      />
      <path
        fill="#EA4335"
        d="M24 10c3.2 0 6 .1 8.7 2.5 2-1.9 1.9-2 1.9-2l6.9-6.6C37.8 2.1 31.7 0 24 0 15.6 0 8.2 3.9 4.6 9.7l7.3 5.7C13.6 13.8 18.4 10 24 10z"
      />
    </svg>
  )
}

export function AppleMark({ className }: MarkProps) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={cn('size-5', className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
    >
      <path d="M16.37 1.43c0 1.14-.42 2.2-1.25 3.18-.99 1.18-2.19 1.86-3.48 1.75-.02-.14-.03-.28-.03-.42 0-1.1.48-2.27 1.3-3.2.84-.94 2.02-1.6 3.2-1.68.02.12.03.24.03.37zM20.9 17.1c-.36.83-.79 1.6-1.3 2.3-.68.96-1.24 1.63-1.67 2-.66.62-1.37.94-2.13.96-.55 0-1.2-.16-1.97-.48-.77-.32-1.48-.48-2.13-.48-.68 0-1.42.17-2.22.5-.8.34-1.44.51-1.92.52-.73.03-1.46-.3-2.18-.95-.47-.4-1.06-1.1-1.77-2.1-.76-1.07-1.38-2.3-1.85-3.72-.5-1.52-.76-3-.76-4.42 0-1.64.35-3.05 1.05-4.23.55-.94 1.29-1.68 2.21-2.22.93-.55 1.93-.83 3.01-.85.58 0 1.35.18 2.3.53.95.35 1.56.53 1.83.53.2 0 .87-.21 2.02-.62 1.08-.39 2-.55 2.74-.49 2.02.16 3.55.96 4.55 2.4-1.8 1.1-2.7 2.63-2.68 4.6.01 1.53.57 2.8 1.67 3.8.5.47 1.06.83 1.68 1.09-.13.39-.28.76-.44 1.12z" />
    </svg>
  )
}

export function FacebookMark({ className }: MarkProps) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={cn('size-5', className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="var(--color-brand-facebook)"
        d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C17.61 23.1 24 18.1 24 12.07z"
      />
    </svg>
  )
}
