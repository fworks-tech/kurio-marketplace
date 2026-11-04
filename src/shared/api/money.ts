/**
 * Decimal-string money helpers (single precision strategy).
 *
 * ETH is carried as decimal strings in the API contract (README, specs E7).
 * All arithmetic is done in integer micro-units (1e6) so repeated addition,
 * quantity multiplication, discounts, and network fees never drift through
 * binary floating point. Quote, cart, and order math share these helpers so
 * one value never rounds differently depending on which path produced it.
 */

export const MICRO = 1_000_000

export function toMicro(value: string): number {
  return Math.round(parseFloat(value) * MICRO)
}

export function fromMicro(value: number): string {
  const sign = value < 0 ? '-' : ''
  const abs = Math.abs(value)
  const whole = Math.floor(abs / MICRO)
  const fraction = String(abs % MICRO).padStart(6, '0').replace(/0+$/, '')
  return `${sign}${whole}${fraction ? `.${fraction}` : ''}`
}

export function multiplyMoney(unitPrice: string, quantity: number): string {
  return fromMicro(toMicro(unitPrice) * quantity)
}
