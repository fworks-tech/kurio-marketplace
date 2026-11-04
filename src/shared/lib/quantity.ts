export function clampQuantity(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.min(Math.max(Math.trunc(value), min), max)
}

export function stepQuantity(
  value: number,
  delta: number,
  min: number,
  max: number
): number {
  return clampQuantity(value + delta, min, max)
}

export interface QuantityLimits {
  atMin: boolean
  atMax: boolean
}

export function quantityLimits(value: number, min: number, max: number): QuantityLimits {
  return { atMin: value <= min, atMax: value >= max }
}
