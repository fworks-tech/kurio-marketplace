import { Toaster as Sonner, type ToasterProps } from 'sonner'
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from 'lucide-react'

/**
 * Toaster themed with the Kurio palette.
 *
 * The app is dark-only, so the theme is pinned instead of following the OS
 * preference (there is no ThemeProvider), and every surface token is wired so
 * the toast never falls back to Sonner's stock colours.
 */
const Toaster = ({ ...props }: ToasterProps) => (
  <Sonner
    theme="dark"
    position="top-right"
    className="kurio-toaster"
    offset={92}
    mobileOffset={{ top: 84, right: 12, bottom: 12, left: 12 }}
    closeButton
    visibleToasts={3}
    gap={10}
    icons={{
      success: <CircleCheckIcon className="size-4" />,
      info: <InfoIcon className="size-4" />,
      warning: <TriangleAlertIcon className="size-4" />,
      error: <OctagonXIcon className="size-4" />,
      loading: <Loader2Icon className="size-4 animate-spin" />
    }}
    style={
      {
        '--normal-bg': 'var(--color-surface-card)',
        '--normal-text': 'var(--color-canvas)',
        '--normal-border': 'var(--color-muted-strong)',
        '--border-radius': 'var(--radius-md)',
        '--width': '380px'
      } as React.CSSProperties
    }
    toastOptions={{
      classNames: {
        toast: 'kurio-toast',
        title: 'kurio-toast__title',
        description: 'kurio-toast__description',
        actionButton: 'kurio-toast__action',
        cancelButton: 'kurio-toast__cancel',
        closeButton: 'kurio-toast__close'
      }
    }}
    {...props}
  />
)

export { Toaster }
