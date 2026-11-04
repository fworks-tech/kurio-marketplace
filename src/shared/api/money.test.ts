import { describe, expect, it } from 'vitest'
import { toMicro, fromMicro, multiplyMoney, MICRO } from './money'

describe('money precision', () => {
  it('round-trips two-decimal ETH values exactly', () => {
    expect(toMicro('2.50')).toBe(2.5 * MICRO)
    expect(fromMicro(toMicro('2.50'))).toBe('2.5')
  })

  it('keeps sub-cent precision that cent rounding would lose', () => {
    // 0.000001 ETH * 3 must not collapse to "0".
    expect(multiplyMoney('0.000001', 3)).toBe('0.000003')
  })

  it('avoids binary floating-point drift on repeated adds', () => {
    const unit = '0.1'
    // 0.1 + 0.2 in floating point is 0.30000000000000004; micro math is exact.
    const micro = toMicro(unit) + toMicro('0.2')
    expect(fromMicro(micro)).toBe('0.3')
  })

  it('formats large quantities without exponential notation', () => {
    expect(multiplyMoney('1000.25', 4)).toBe('4001')
  })

  it('preserves the sign of negative deltas', () => {
    expect(fromMicro(-1500000)).toBe('-1.5')
  })
})
