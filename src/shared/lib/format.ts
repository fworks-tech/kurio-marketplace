const ETH_MAX_DECIMALS = 6

interface DecimalParts {
  negative: boolean
  integer: string
  fraction: string
}

function splitDecimals(value: string): DecimalParts {
  const raw = value.trim()
  const negative = raw.startsWith('-')
  const unsigned = negative ? raw.slice(1) : raw
  const [integer = '0', fraction = ''] = unsigned.split('.')
  return { negative, integer: integer || '0', fraction }
}

/** Dot-separated ETH with at most 6 decimals, trailing zeros dropped, never rounded. */
export function formatEth(value: string): string {
  const { negative, integer, fraction } = splitDecimals(value)
  const trimmed = fraction.slice(0, ETH_MAX_DECIMALS).replace(/0+$/, '')
  const body = trimmed ? `${integer}.${trimmed}` : integer
  return negative && body !== '0' ? `-${body}` : body
}

export function formatPrice(value: string): string {
  return `${formatEth(value)} ETH`
}

/** Comma decimal with exactly two digits, as the price filter draws it (e.g. 12,30). */
function toPtBrFixed(value: string): string {
  const { integer, fraction } = splitDecimals(value)
  return `${integer},${fraction.slice(0, 2).padEnd(2, '0')}`
}

/** Price filter range uses comma decimals, unlike the card/price dot format. */
export function formatPriceRange(min: string, max: string): string {
  return `${toPtBrFixed(min)} - ${toPtBrFixed(max)} ETH`
}

function isZeroAmount(value: string): boolean {
  const { integer, fraction } = splitDecimals(value)
  return Number.parseInt(integer, 10) === 0 && fraction.replace(/0+$/, '') === ''
}

/** Cart discount renders without the ETH unit and keeps a zero discount as drawn. */
export function formatDiscountLine(value: string): string {
  if (isZeroAmount(value)) return '(-) 00.00'
  return `(-) ${formatEth(value)}`
}

export function truncateMiddle(value: string, head = 6, tail = 4): string {
  if (value.length <= head + tail + 1) return value
  return `${value.slice(0, head)}…${value.slice(-tail)}`
}

export function shortAddress(address: string): string {
  return truncateMiddle(address, 6, 4)
}

/** Token ids are drawn with a leading hash and are shown as-is. */
/** `nft-289` → `#0289`, matching the four-digit token ids used in the designs. */
export function formatTokenId(id: string): string {
  const digits = id.match(/(\d+)\s*$/)?.[1]
  if (digits) return `#${digits.padStart(4, '0')}`

  return id.startsWith('#') ? id : `#${id}`
}
