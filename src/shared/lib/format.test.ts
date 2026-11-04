import { describe, expect, it } from 'vitest'
import {
  formatDiscountLine,
  formatEth,
  formatPrice,
  formatPriceRange,
  shortAddress,
  truncateMiddle,
} from './format'

describe('formatEth', () => {
  it('keeps a plain decimal and strips trailing zeros', () => {
    expect(formatEth('2.5')).toBe('2.5')
    expect(formatEth('2.5000')).toBe('2.5')
    expect(formatEth('26.846000')).toBe('26.846')
  })

  it('keeps integers whole', () => {
    expect(formatEth('3.0000')).toBe('3')
    expect(formatEth('0')).toBe('0')
  })

  it('truncates beyond six decimals without rounding', () => {
    expect(formatEth('1.0000009')).toBe('1')
    expect(formatEth('1.1999999')).toBe('1.199999')
  })

  it('preserves the sign', () => {
    expect(formatEth('-0.50')).toBe('-0.5')
  })
})

describe('formatPrice', () => {
  it('appends the ETH unit', () => {
    expect(formatPrice('1.19')).toBe('1.19 ETH')
  })
})

describe('formatPriceRange', () => {
  it('uses pt-BR comma decimals, unlike price cards', () => {
    expect(formatPriceRange('0.02', '12.3')).toBe('0,02 - 12,30 ETH')
  })
})

describe('formatDiscountLine', () => {
  it('renders a real discount without the ETH unit', () => {
    expect(formatDiscountLine('0.5')).toBe('(-) 0.5')
  })

  it('keeps a zero discount as drawn', () => {
    expect(formatDiscountLine('0')).toBe('(-) 00.00')
  })
})

describe('shortAddress', () => {
  it('leaves already-short values untouched', () => {
    expect(shortAddress('0x1234')).toBe('0x1234')
  })

  it('truncates in the middle, keeping head and tail', () => {
    expect(shortAddress('0x7aB8f1c2d3e4a5b6c7d8e9f0a1b2c3d4e5f69f3D')).toBe('0x7aB8…9f3D')
  })
})

describe('truncateMiddle', () => {
  it('leaves short values untouched', () => {
    expect(truncateMiddle('nova.eth', 4, 4)).toBe('nova.eth')
  })

  it('keeps the configured head and tail', () => {
    expect(truncateMiddle('verylongusername.eth', 6, 4)).toBe('verylo….eth')
  })
})
