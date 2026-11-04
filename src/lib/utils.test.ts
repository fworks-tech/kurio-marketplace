import { describe, expect, it } from 'vitest'
import { cn } from './utils'

describe('cn', () => {
  it('merges conflicting tailwind utilities (last wins)', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })

  it('drops falsy classes and keeps the rest', () => {
    expect(cn('text-sm', false && 'text-lg', 'font-bold')).toBe('text-sm font-bold')
  })
})
