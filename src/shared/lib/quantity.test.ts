import { describe, expect, it } from 'vitest'
import { clampQuantity, quantityLimits, stepQuantity } from './quantity'

describe('clampQuantity', () => {
  it('clamps below the minimum and above the maximum', () => {
    expect(clampQuantity(0, 1, 10)).toBe(1)
    expect(clampQuantity(20, 1, 10)).toBe(10)
  })

  it('truncates fractional input to an integer', () => {
    expect(clampQuantity(2.9, 1, 10)).toBe(2)
  })

  it('falls back to the minimum on non-finite input', () => {
    expect(clampQuantity(Number.NaN, 1, 10)).toBe(1)
  })
})

describe('stepQuantity', () => {
  it('stops at the maximum when stepping up', () => {
    expect(stepQuantity(10, 1, 1, 10)).toBe(10)
  })

  it('stops at the minimum when stepping down', () => {
    expect(stepQuantity(1, -1, 1, 10)).toBe(1)
  })
})

describe('quantityLimits', () => {
  it('reports the active boundaries', () => {
    expect(quantityLimits(1, 1, 3)).toEqual({ atMin: true, atMax: false })
    expect(quantityLimits(3, 1, 3)).toEqual({ atMin: false, atMax: true })
  })
})
