import type { NftReview } from '@/shared/api/api-types'

const AUTHORS = [
  'Nova Sato',
  'Caio Bertoni',
  'Lia Ferraz',
  'Tomas Reis',
  'Bia Antunes',
  'Rafa Duarte'
]

const NOTES = [
  'A arte é ainda melhor no detalhe, textura impecável.',
  'Cunhagem rápida e proveniência clara. Recomendo.',
  'Coleção consistente, chegou bem embalado no meu cofre.',
  'Cores vibrantes, ficou ótimo na galeria.',
  'Entrega digital sem atrito, cuidado nos metadados.',
  'Boa curadoria, acompanho a coleção desde o primeiro drop.'
]

/** Deterministic review set: same NFT always returns the same reviews. */
export function reviewsFor(nftId: string): NftReview[] {
  const seed = [...nftId].reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const total = 8 + (seed % 12) // 8..19
  return Array.from({ length: total }, (_, index) => {
    const pick = seed + index
    return {
      id: `${nftId}-review-${index + 1}`,
      author: AUTHORS[pick % AUTHORS.length] ?? AUTHORS[0]!,
      rating: 4 + ((pick % 3) === 0 ? 1 : 0),
      date: new Date(Date.UTC(2026, (pick % 9), 3 + (pick % 20))).toISOString(),
      text: NOTES[pick % NOTES.length] ?? NOTES[0]!
    }
  })
}
