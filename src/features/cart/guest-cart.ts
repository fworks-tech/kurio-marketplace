/**
 * Guest cart — items a visitor picks before signing in.
 *
 * The backend scopes carts to an authenticated user, so the visitor's basket lives
 * in `localStorage` until the session exists and is then merged into the account
 * cart (see `use-merge-guest-cart.ts`). Keeping it in storage means the basket also
 * survives a refresh or a closed tab, which the challenge asks for.
 */
export interface GuestCartItem {
  nftId: string
  quantity: number
}

const STORAGE_KEY = 'kurio:guest-cart'
const CHANGE_EVENT = 'kurio:guest-cart-change'

function safeParse(raw: string | null): GuestCartItem[] {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((entry) => {
      if (!entry || typeof entry !== 'object') return []
      const { nftId, quantity } = entry as Record<string, unknown>
      if (typeof nftId !== 'string' || !nftId) return []
      const qty = typeof quantity === 'number' && Number.isFinite(quantity) ? quantity : 1
      return [{ nftId, quantity: Math.min(Math.max(Math.trunc(qty), 1), 99) }]
    })
  } catch {
    return []
  }
}

export function readGuestCart(): GuestCartItem[] {
  if (typeof window === 'undefined') return []
  return safeParse(window.localStorage.getItem(STORAGE_KEY))
}

function commit(items: GuestCartItem[]): GuestCartItem[] {
  if (typeof window === 'undefined') return items
  if (items.length) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  else window.localStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new Event(CHANGE_EVENT))
  return items
}

export function addGuestItem(nftId: string, quantity = 1): GuestCartItem[] {
  const items = readGuestCart()
  const current = items.find((item) => item.nftId === nftId)
  if (current) {
    current.quantity = Math.min(current.quantity + quantity, 99)
    return commit(items)
  }
  return commit([...items, { nftId, quantity: Math.min(Math.max(quantity, 1), 99) }])
}

export function setGuestQuantity(nftId: string, quantity: number): GuestCartItem[] {
  if (quantity < 1) return removeGuestItem(nftId)
  return commit(
    readGuestCart().map((item) =>
      item.nftId === nftId ? { ...item, quantity: Math.min(quantity, 99) } : item
    )
  )
}

export function removeGuestItem(nftId: string): GuestCartItem[] {
  return commit(readGuestCart().filter((item) => item.nftId !== nftId))
}

export function clearGuestCart(): void {
  commit([])
}

/** Total units in the visitor basket (badge count). */
export function guestCartCount(items: GuestCartItem[] = readGuestCart()): number {
  return items.reduce((total, item) => total + item.quantity, 0)
}

/** Fires on every mutation and on cross-tab `storage` events. */
export function subscribeGuestCart(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener()
  }
  window.addEventListener(CHANGE_EVENT, listener)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(CHANGE_EVENT, listener)
    window.removeEventListener('storage', onStorage)
  }
}
