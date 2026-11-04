import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { FacebookMark, GoogleMark } from './brand-marks'

interface SocialButtonProps {
  provider: 'google' | 'facebook'
  onClick: () => void
  disabled?: boolean
  children?: ReactNode
}

const PROVIDERS: Record<SocialButtonProps['provider'], { label: string; mark: ReactNode }> = {
  google: { label: 'Google', mark: <GoogleMark className="size-5" /> },
  facebook: { label: 'Facebook', mark: <FacebookMark className="size-5" /> }
}

export function SocialButton({ provider, onClick, disabled, children }: SocialButtonProps) {
  const { label, mark } = PROVIDERS[provider]
  return (
    <Button type="button" variant="outline" className="w-full" onClick={onClick} disabled={disabled}>
      {mark}
      {children ?? `Continuar com ${label}`}
    </Button>
  )
}
