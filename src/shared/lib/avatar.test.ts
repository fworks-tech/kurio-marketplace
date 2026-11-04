import { describe, expect, it } from 'vitest'
import { validateAvatar } from './avatar'

describe('validateAvatar', () => {
  it('accepts an allowed type within the size limit', () => {
    expect(validateAvatar({ type: 'image/webp', size: 200 * 1024 })).toEqual({ ok: true })
  })

  it('rejects a disallowed type', () => {
    expect(validateAvatar({ type: 'image/gif', size: 10 }).error).toMatch(/Formato inválido/)
  })

  it('rejects a file over 256 KB', () => {
    expect(validateAvatar({ type: 'image/png', size: 257 * 1024 }).error).toMatch(/256 KB/)
  })

  it('accepts a file exactly at the size limit', () => {
    expect(validateAvatar({ type: 'image/jpeg', size: 256 * 1024 })).toEqual({ ok: true })
  })
})
