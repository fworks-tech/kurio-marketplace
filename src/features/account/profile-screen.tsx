import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { AccountSidebar } from '@/features/account/components/account-sidebar'
import { AccountField, accountInputClass } from '@/features/account/components/account-field'
import { AccountLayout } from '@/features/account/account-layout'
import { useSession } from '@/features/session/session-queries'
import { endSession } from '@/features/session/session-actions'
import { profileService, walletService } from '@/shared/services'
import { ApiError } from '@/shared/api/api-error'
import { queryKeys } from '@/shared/lib/query-client'
import { AVATAR_ACCEPTED_TYPES, validateAvatar } from '@/shared/lib/avatar'
import { cn } from '@/lib/utils'

const ENS_SUFFIXES = ['.eth', '.base', '.sol'] as const

type ProfileFieldErrors = Partial<Record<'displayName' | 'email' | 'ensName' | 'username', string>>

/** Reads the per-field messages the mocked API returns for a failed save. */
function fieldErrorsOf(error: unknown): ProfileFieldErrors {
  if (error instanceof ApiError && error.fieldErrors) {
    return Object.fromEntries(
      Object.entries(error.fieldErrors).map(([key, messages]) => [key, messages[0]])
    ) as ProfileFieldErrors
  }
  return {}
}

/**
 * `Desktop / Perfil do Colecionador`: account rail + collector form.
 * Figma reference: 1200px body, 310px rail, 28px gutter, 862px form column,
 * 417px form columns, 40px controls with a 3px radius.
 */
export function ProfileScreen() {
  const { data: session } = useSession()
  const userId = session?.user.id ?? ''
  const queryClient = useQueryClient()

  const profileQuery = useQuery({
    queryKey: queryKeys.profile(userId),
    queryFn: ({ signal }) => profileService.get({ signal }),
    enabled: Boolean(userId)
  })
  const walletsQuery = useQuery({
    queryKey: queryKeys.wallets(userId),
    queryFn: ({ signal }) => walletService.list({ signal }),
    enabled: Boolean(userId)
  })

  const profile = profileQuery.data
  const primaryWallet = walletsQuery.data?.find((wallet) => wallet.isPrimary) ?? walletsQuery.data?.[0]

  const [errors, setErrors] = useState<ProfileFieldErrors>({})
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({})
  const [ensSuffix, setEnsSuffix] = useState<string>('.eth')
  const [avatarError, setAvatarError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const passwordFormRef = useRef<HTMLFormElement>(null)

  const invalidateProfile = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.profile(userId) })
    void queryClient.invalidateQueries({ queryKey: queryKeys.wallets(userId) })
    void queryClient.invalidateQueries({ queryKey: queryKeys.session })
  }

  const saveProfile = useMutation({
    mutationFn: async (dto: { displayName: string; email: string; ensName: string; walletLabel: string }) => {
      await profileService.update({
        displayName: dto.displayName,
        email: dto.email,
        ensName: dto.ensName
      })
      if (primaryWallet && dto.walletLabel !== primaryWallet.label) {
        await walletService.update(primaryWallet.id, { label: dto.walletLabel })
      }
    },
    onSuccess: () => {
      setErrors({})
      invalidateProfile()
      toast.success('Perfil salvo.')
    },
    onError: (error) => {
      const mapped = fieldErrorsOf(error)
      setErrors(mapped)
      toast.error(
        Object.keys(mapped).length > 0 ? 'Revise os campos destacados.' : 'Não foi possível salvar o perfil.'
      )
    }
  })

  const savePassword = useMutation({
    mutationFn: (dto: { currentPassword: string; newPassword: string }) => profileService.changePassword(dto),
    onSuccess: () => {
      setPasswordErrors({})
      passwordFormRef.current?.reset()
      toast.success('Senha alterada.')
    },
    onError: (error) => {
      const raw = error instanceof ApiError ? (error.fieldErrors ?? {}) : {}
      setPasswordErrors({
        currentPassword: raw.currentPassword?.[0] ?? '',
        newPassword: raw.newPassword?.[0] ?? ''
      })
      toast.error('Não foi possível alterar a senha.')
    }
  })

  const updateAvatar = useMutation({
    mutationFn: (avatar: string | null) => profileService.updateAvatar(avatar),
    onSuccess: () => {
      setAvatarError('')
      invalidateProfile()
      toast.success('Avatar atualizado.')
    },
    onError: () => {
      setAvatarError('Não foi possível atualizar o avatar.')
      toast.error('Não foi possível atualizar o avatar.')
    }
  })

  const handleProfileSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    saveProfile.mutate({
      displayName: String(data.get('displayName') ?? '').trim(),
      email: String(data.get('email') ?? '').trim(),
      ensName: String(data.get('ensName') ?? '').trim(),
      walletLabel: String(data.get('walletLabel') ?? '').trim()
    })
  }

  const handlePasswordSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const currentPassword = String(data.get('currentPassword') ?? '')
    const newPassword = String(data.get('newPassword') ?? '')
    const confirmPassword = String(data.get('confirmPassword') ?? '')

    const nextErrors: Record<string, string> = {}
    if (!currentPassword) nextErrors.currentPassword = 'Informe a senha atual.'
    if (newPassword.length < 8) nextErrors.newPassword = 'A nova senha precisa de ao menos 8 caracteres.'
    if (newPassword !== confirmPassword) nextErrors.confirmPassword = 'As senhas não coincidem.'
    setPasswordErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    savePassword.mutate({ currentPassword, newPassword })
  }

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const result = validateAvatar({ type: file.type, size: file.size })
    if (!result.ok) {
      setAvatarError(result.error ?? 'Arquivo inválido.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => updateAvatar.mutate(String(reader.result))
    reader.readAsDataURL(file)
  }

  const handleSignOut = () => {
    void endSession()
  }

  return (
    <AccountLayout sidebar={<AccountSidebar active="perfil" onSignOut={handleSignOut} />}>
      <div className="flex flex-col gap-8">
        <form onSubmit={handleProfileSubmit} className="flex flex-col gap-8" noValidate>
          <h1 className="text-text text-[16px] leading-4 font-bold">Perfil do colecionador</h1>

          <div className="grid gap-x-7 gap-y-6 sm:grid-cols-2">
            <AccountField label="Nome de exibição" required error={errors.displayName}>
              {({ id, describedBy, invalid }) => (
                <input
                  id={id}
                  name="displayName"
                  defaultValue={profile?.displayName ?? ''}
                  aria-describedby={describedBy}
                  aria-invalid={invalid || undefined}
                  required
                  className={accountInputClass}
                />
              )}
            </AccountField>

            <AccountField label="Nome de usuário" required error={errors.username}>
              {({ id, describedBy }) => (
                <input
                  id={id}
                  name="username"
                  defaultValue={profile?.username ?? ''}
                  aria-describedby={describedBy}
                  readOnly
                  className={cn(accountInputClass, 'text-sand')}
                />
              )}
            </AccountField>

            <AccountField label="E-mail" required error={errors.email}>
              {({ id, describedBy, invalid }) => (
                <input
                  id={id}
                  name="email"
                  type="email"
                  defaultValue={profile?.email ?? ''}
                  aria-describedby={describedBy}
                  aria-invalid={invalid || undefined}
                  required
                  className={accountInputClass}
                />
              )}
            </AccountField>

            <AccountField label="Nome ENS" required error={errors.ensName}>
              {({ id, describedBy, invalid }) => (
                <div className="flex gap-2.5">
                  <div className="relative w-[78px] shrink-0">
                    <select
                      aria-label="Sufixo do nome ENS"
                      value={ensSuffix}
                      onChange={(event) => setEnsSuffix(event.target.value)}
                      className={cn(accountInputClass, 'appearance-none pr-6')}
                    >
                      {ENS_SUFFIXES.map((suffix) => (
                        <option key={suffix} value={suffix} className="bg-surface-card text-text">
                          {suffix}
                        </option>
                      ))}
                    </select>
                    <span
                      aria-hidden
                      className="text-text pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-[10px]"
                    >
                      ▾
                    </span>
                  </div>
                  <input
                    id={id}
                    name="ensName"
                    defaultValue={profile?.ensName ?? ''}
                    aria-describedby={describedBy}
                    aria-invalid={invalid || undefined}
                    required
                    className={cn(accountInputClass, 'flex-1')}
                  />
                </div>
              )}
            </AccountField>

            <AccountField label="Apelido da carteira" required>
              {({ id }) => (
                <input
                  id={id}
                  name="walletLabel"
                  defaultValue={primaryWallet?.label ?? ''}
                  className={accountInputClass}
                />
              )}
            </AccountField>

            <AccountField label="Avatar" error={avatarError}>
              {({ id, describedBy }) => (
                <div className="flex items-center gap-6">
                  <span className="border-field bg-surface-raised grid size-[50px] shrink-0 place-items-center overflow-hidden rounded-full border p-3">
                    {profile?.avatar ? (
                      <img
                        src={profile.avatar}
                        alt={`Avatar de ${profile.displayName ?? profile.username}`}
                        className="size-full object-cover"
                      />
                    ) : (
                      <ImageIcon aria-hidden strokeWidth={1.5} className="text-primary size-[26px]" />
                    )}
                  </span>
                  <div className="flex items-center gap-5">
                    <input
                      ref={fileRef}
                      id={id}
                      type="file"
                      accept={AVATAR_ACCEPTED_TYPES.join(',')}
                      aria-describedby={describedBy}
                      className="sr-only"
                      onChange={handleFile}
                    />
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={updateAvatar.isPending}
                      className="bg-primary text-ink h-10 min-w-[98px] rounded-field px-4 text-[14px] leading-none font-bold disabled:opacity-60"
                    >
                      Alterar
                    </button>
                    <button
                      type="button"
                      onClick={() => updateAvatar.mutate(null)}
                      disabled={updateAvatar.isPending || !profile?.avatar}
                      className="text-text text-[14px] leading-none disabled:opacity-50"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              )}
            </AccountField>
          </div>

          <button
            type="submit"
            disabled={saveProfile.isPending}
            className="bg-primary text-ink rounded-field h-10 min-w-[131px] self-start px-4 text-[14px] leading-none font-bold whitespace-nowrap disabled:opacity-60"
          >
            Salvar
          </button>
        </form>

        <form
          ref={passwordFormRef}
          onSubmit={handlePasswordSubmit}
          className="flex flex-col gap-6"
          noValidate
        >
          <h2 className="text-text text-[16px] leading-4 font-medium">Alterar senha</h2>

          <div className="grid gap-x-7 gap-y-6 sm:grid-cols-2">
            <AccountField label="Senha atual" error={passwordErrors.currentPassword}>
              {({ id, describedBy, invalid }) => (
                <input
                  id={id}
                  name="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  aria-describedby={describedBy}
                  aria-invalid={invalid || undefined}
                  className={accountInputClass}
                />
              )}
            </AccountField>
            <AccountField label="Nova senha" error={passwordErrors.newPassword}>
              {({ id, describedBy, invalid }) => (
                <input
                  id={id}
                  name="newPassword"
                  type="password"
                  autoComplete="new-password"
                  aria-describedby={describedBy}
                  aria-invalid={invalid || undefined}
                  className={accountInputClass}
                />
              )}
            </AccountField>
            <AccountField label="Confirmar nova senha" error={passwordErrors.confirmPassword}>
              {({ id, describedBy, invalid }) => (
                <input
                  id={id}
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  aria-describedby={describedBy}
                  aria-invalid={invalid || undefined}
                  className={accountInputClass}
                />
              )}
            </AccountField>
          </div>

          <button
            type="submit"
            disabled={savePassword.isPending}
            className="bg-primary text-ink rounded-field h-10 min-w-[131px] self-start px-4 text-[14px] leading-none font-bold whitespace-nowrap disabled:opacity-60"
          >
            Salvar
          </button>
        </form>
      </div>
    </AccountLayout>
  )
}
