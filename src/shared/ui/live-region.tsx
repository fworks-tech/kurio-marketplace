import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react'

interface LiveRegionValue {
  announce: (message: string) => void
  announceAlert: (message: string) => void
}

const LiveRegionContext = createContext<LiveRegionValue | null>(null)

function useAnnouncement() {
  const [message, setMessage] = useState('')
  const frame = useRef<number | undefined>(undefined)

  useEffect(
    () => () => {
      if (frame.current !== undefined) window.cancelAnimationFrame(frame.current)
    },
    []
  )

  const announce = useCallback((next: string) => {
    setMessage('')
    frame.current = window.requestAnimationFrame(() => setMessage(next))
  }, [])

  return { message, announce }
}

export function LiveRegionProvider({ children }: { children: ReactNode }) {
  const polite = useAnnouncement()
  const assertive = useAnnouncement()

  const value = useMemo<LiveRegionValue>(
    () => ({ announce: polite.announce, announceAlert: assertive.announce }),
    [polite.announce, assertive.announce]
  )

  return (
    <LiveRegionContext.Provider value={value}>
      {children}
      <div role="status" aria-live="polite" className="sr-only">
        {polite.message}
      </div>
      <div role="alert" aria-live="assertive" className="sr-only">
        {assertive.message}
      </div>
    </LiveRegionContext.Provider>
  )
}

export function useAnnounce(): LiveRegionValue {
  const context = useContext(LiveRegionContext)
  if (!context) {
    throw new Error('useAnnounce must be used within a LiveRegionProvider')
  }
  return context
}
