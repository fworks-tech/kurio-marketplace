export type PageToken = number | 'gap'

function range(start: number, end: number): number[] {
  const out: number[] = []
  for (let p = start; p <= end; p += 1) out.push(p)
  return out
}

/** Numeric page list that always anchors first/last and ellipsizes interior gaps. */
export function buildPageList(current: number, total: number): PageToken[] {
  if (total <= 7) return range(1, total)

  const pages = new Set<number>([1, total])
  for (const candidate of [current - 1, current, current + 1]) {
    if (candidate >= 1 && candidate <= total) pages.add(candidate)
  }

  const sorted = [...pages].sort((a, b) => a - b)
  const result: PageToken[] = []
  let previous = 0
  for (const page of sorted) {
    if (previous && page - previous > 1) result.push('gap')
    result.push(page)
    previous = page
  }
  return result
}

/**
 * Sliding window of at most `size` contiguous pages — the Figma pagination renders
 * four 35x35 cells plus a next arrow, so the visible window follows the active page.
 */
export function buildPageWindow(page: number, totalPages: number, size = 4): number[] {
  if (totalPages <= 0) return []
  if (totalPages <= size) return Array.from({ length: totalPages }, (_, i) => i + 1)
  const start = Math.min(Math.max(page - 1, 1), totalPages - size + 1)
  return Array.from({ length: size }, (_, i) => start + i)
}
