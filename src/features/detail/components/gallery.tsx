import { useState } from 'react'
import { cn } from '@/lib/utils'

export interface GalleryImage {
  src: string
  alt: string
}

interface GalleryProps {
  images: GalleryImage[]
  index?: number
  onIndexChange?: (index: number) => void
  className?: string
}

/**
 * Figma `Product block / Gallery` (573px column): a 100px thumbnail rail with a
 * 16px rhythm, a 444px main canvas on `#241612` with 16px padding and a 404px
 * artwork at a 24px radius.
 */
export function Gallery({ images, index: controlled, onIndexChange, className }: GalleryProps) {
  const [internal, setInternal] = useState(0)
  const index = controlled ?? internal
  const setIndex = (next: number) => {
    setInternal(next)
    onIndexChange?.(next)
  }
  const active = images[index] ?? images[0]

  if (!active) return null

  return (
    <div className={cn('flex flex-col-reverse gap-4 lg:flex-row lg:gap-7', className)}>
      <ul className="flex gap-4 overflow-x-auto lg:w-[100px] lg:shrink-0 lg:flex-col" aria-label="Miniaturas">
        {images.slice(0, 4).map((image, itemIndex) => (
          <li key={image.src}>
            <button
              type="button"
              onClick={() => setIndex(itemIndex)}
              aria-label={`Ver imagem ${itemIndex + 1}`}
              aria-current={itemIndex === index ? 'true' : undefined}
              className={cn(
                'bg-surface-card size-20 overflow-hidden rounded-[8px] border transition-colors lg:size-[100px]',
                itemIndex === index ? 'border-primary' : 'border-transparent'
              )}
            >
              <img src={image.src} alt="" className="size-full object-cover" />
            </button>
          </li>
        ))}
      </ul>

      <div className="bg-surface-card relative aspect-square w-full max-w-[444px] shrink-0 rounded-[6px] p-4 lg:size-[444px]">
        <img
          src={active.src}
          alt={active.alt}
          className="size-full rounded-[24px] object-cover"
        />
        <a
          href={active.src}
          target="_blank"
          rel="noreferrer"
          aria-label="Ampliar imagem"
          className="text-canvas absolute top-[15px] right-[15px] grid size-[30px] place-items-center rounded-full border border-[#3F2319] bg-[#2F1D15]"
        >
          <svg viewBox="0 0 20 20" aria-hidden className="size-5" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="9" cy="9" r="6" />
            <path d="M13.5 13.5 17 17M9 6.5v5M6.5 9h5" />
          </svg>
        </a>
      </div>
    </div>
  )
}
