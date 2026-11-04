import { Link } from '@tanstack/react-router'
import type { LinkProps } from '@tanstack/react-router'

type RouteTo = LinkProps['to']

interface InlineLinkProps {
  before?: string
  linkText: string
  after?: string
  to?: string
  onClick?: () => void
}

export function InlineLink({ before, linkText, after, to, onClick }: InlineLinkProps) {
  return (
    <p className="text-text-secondary text-sm">
      {before ? `${before} ` : null}
      {to ? (
        <Link to={to as unknown as RouteTo} className="text-primary font-semibold underline-offset-4 hover:underline">
          {linkText}
        </Link>
      ) : (
        <button type="button" onClick={onClick} className="text-primary font-semibold underline-offset-4 hover:underline">
          {linkText}
        </button>
      )}
      {after ? ` ${after}` : null}
    </p>
  )
}
