interface SkeletonProps {
  className?: string
  label?: string
}

/** Dimension-preserving loading placeholder with an accessible status. */
export function Skeleton({ className, label = 'Loading' }: SkeletonProps) {
  return (
    <span
      role="status"
      aria-busy="true"
      className={className ? `skeleton block ${className}` : 'skeleton block'}
    >
      <span className="sr-only">{label}</span>
    </span>
  )
}
