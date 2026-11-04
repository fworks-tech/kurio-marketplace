import { useRef, useState } from 'react'
import { UserIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AVATAR_ACCEPTED_TYPES, validateAvatar } from '@/shared/lib/avatar'

interface AvatarUploaderProps {
  value?: string | null
  onChange: (dataUrl: string | null) => void
  alt?: string
}

export function AvatarUploader({ value, onChange, alt = 'Foto de perfil' }: AvatarUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')

  const handleFile = (file: File | undefined) => {
    if (!file) return
    const result = validateAvatar({ type: file.type, size: file.size })
    if (!result.ok) {
      setError(result.error ?? 'Arquivo inválido.')
      return
    }
    setError('')
    const reader = new FileReader()
    reader.onload = () => onChange(String(reader.result))
    reader.readAsDataURL(file)
  }

  return (
    <div className="flex items-center gap-4">
      <div className="bg-surface-raised grid size-20 shrink-0 place-items-center overflow-hidden rounded-full border border-white/15">
        {value ? (
          <img src={value} alt={alt} className="size-full object-cover" />
        ) : (
          <UserIcon aria-hidden className="text-text-secondary size-8" />
        )}
      </div>

      <div className="space-y-2">
        <input
          ref={inputRef}
          type="file"
          accept={AVATAR_ACCEPTED_TYPES.join(',')}
          className="sr-only"
          onChange={(event) => handleFile(event.target.files?.[0])}
        />
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
            Alterar
          </Button>
          {value ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setError('')
                onChange(null)
              }}
            >
              Remover
            </Button>
          ) : null}
        </div>
        <p className="text-text-secondary text-xs">JPG, PNG ou WebP. Máximo 256 KB.</p>
        {error ? (
          <p role="alert" className="text-error text-xs">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  )
}
