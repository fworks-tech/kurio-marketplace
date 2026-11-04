import { useCallback, useEffect, useRef, useState } from 'react'
import type { WalletOption } from './components/wallet-network-picker'

/**
 * Simulated wallet handshake used by the Pagamento screen.
 *
 * Connecting mirrors what a real browser wallet does: the request goes out, the
 * extension waits for the user to approve, and the session can end in a connected
 * address or a refusal. Everything is local and deterministic — no real provider.
 */
export type WalletStatus =
  | 'idle'
  | 'connecting'
  | 'awaiting-approval'
  | 'connected'
  | 'refused'

export interface WalletSession {
  status: WalletStatus
  wallet: WalletOption | null
  address: string | null
}

const IDLE: WalletSession = { status: 'idle', wallet: null, address: null }

/** Deterministic pseudo-address so the demo and the tests agree. */
function mockAddress(wallet: WalletOption): string {
  const seed = [...wallet].reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 0xffffffff, 7)
  const body = Array.from({ length: 40 }, (_, i) =>
    Math.floor((seed / (i + 1)) % 16).toString(16)
  ).join('')
  return `0x${body}`
}

export function useWalletConnection() {
  const [session, setSession] = useState<WalletSession>(IDLE)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    []
  )

  const connect = useCallback((wallet: WalletOption) => {
    if (timer.current) clearTimeout(timer.current)
    setSession({ status: 'connecting', wallet, address: null })
    timer.current = setTimeout(
      () => setSession({ status: 'awaiting-approval', wallet, address: null }),
      700
    )
  }, [])

  const approve = useCallback(() => {
    setSession((current) =>
      current.wallet
        ? { status: 'connected', wallet: current.wallet, address: mockAddress(current.wallet) }
        : current
    )
  }, [])

  const refuse = useCallback(() => {
    setSession((current) =>
      current.wallet ? { status: 'refused', wallet: current.wallet, address: null } : current
    )
  }, [])

  const disconnect = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    setSession(IDLE)
  }, [])

  const retry = useCallback(() => {
    setSession((current) => {
      if (current.wallet) connect(current.wallet)
      return current
    })
  }, [connect])

  return { ...session, connect, approve, refuse, disconnect, retry }
}

export type WalletConnection = ReturnType<typeof useWalletConnection>
