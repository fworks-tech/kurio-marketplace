export const AVATAR_MAX_BYTES = 256 * 1024
export const AVATAR_ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export interface AvatarValidationResult {
  ok: boolean
  error?: string
}

/** Avatar is kept small because the demo persists it in localStorage. */
export function validateAvatar(file: { type: string; size: number }): AvatarValidationResult {
  if (!AVATAR_ACCEPTED_TYPES.includes(file.type)) {
    return { ok: false, error: 'Formato inválido. Use JPG, PNG ou WebP.' }
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return { ok: false, error: 'Imagem muito grande. O limite é 256 KB.' }
  }
  return { ok: true }
}
