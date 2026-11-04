import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AccountSidebar } from '@/features/account/components/account-sidebar'
import { AccountField, accountInputClass } from '@/features/account/components/account-field'
import { AccountLayout } from '@/features/account/account-layout'
import { useSession } from '@/features/session/session-queries'
import { useSignOut } from '@/features/session/use-sign-out'
import { profileService, walletService } from '@/shared/services'
import { queryKeys } from '@/shared/lib/query-client'
import { ApiError } from '@/shared/api/api-error'
import type { WalletNetwork } from '@/shared/api/api-types'
import { cn } from '@/lib/utils'

const NETWORKS: readonly WalletNetwork[] = ['Ethereum Mainnet', 'Polygon', 'Arbitrum', 'Optimism']
const WALLET_TYPES = ['Carteira quente', 'Carteira fria', 'Carteira institucional'] as const

/**
 * `Desktop / Carteiras`: account rail + wallet form (862px column, 5 field rows,
 * secondary wallet block). Only `label` and `network` are writable through the
 * wallet contract; the remaining values come from the profile read model.
 */
export function WalletsScreen() {
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
  const wallets = walletsQuery.data ?? []
  const primary = wallets.find((wallet) => wallet.isPrimary) ?? wallets[0]
  const secondaries = wallets.filter((wallet) => wallet.id !== primary?.id)

  const [secondaryOpen, setSecondaryOpen] = useState(false)
  const [sameAsPrimary, setSameAsPrimary] = useState(true)
  const [error, setError] = useState('')

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.wallets(userId) })
    void queryClient.invalidateQueries({ queryKey: queryKeys.profile(userId) })
  }

  const saveWallet = useMutation({
    mutationFn: async (dto: { label: string; network: WalletNetwork }) => {
      if (!primary) throw new Error('missing-wallet')
      return walletService.update(primary.id, { label: dto.label, network: dto.network })
    },
    onSuccess: () => {
      setError('')
      invalidate()
      toast.success('Carteira salva.')
    },
    onError: (mutationError) => {
      const message =
        mutationError instanceof ApiError && mutationError.fieldErrors
          ? 'Revise os campos destacados.'
          : 'Não foi possível salvar a carteira.'
      setError(message)
      toast.error(message)
    }
  })

  const createSecondary = useMutation({
    mutationFn: (dto: { address: string; label: string }) =>
      walletService.create({ address: dto.address, label: dto.label, network: 'Ethereum Mainnet' }),
    onSuccess: () => {
      setSecondaryOpen(false)
      invalidate()
      toast.success('Carteira secundária adicionada.')
    },
    onError: () => toast.error('Não foi possível adicionar a carteira secundária.')
  })

  const signOut = useSignOut()
  const handleSignOut = () => {
    signOut()
  }

  return (
    <AccountLayout sidebar={<AccountSidebar active="carteiras" onSignOut={handleSignOut} />}>
      <div className="flex flex-col gap-8">
        <form
          className="flex flex-col gap-8"
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            const data = new FormData(event.currentTarget)
            saveWallet.mutate({
              label: String(data.get('walletLabel') ?? '').trim(),
              network: String(data.get('network') ?? 'Ethereum Mainnet') as WalletNetwork
            })
          }}
        >
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-text text-[17px] leading-4 font-bold">Carteira principal</h1>
              <button
                type="button"
                onClick={() => setSecondaryOpen(true)}
                className="text-highlight text-[16px] leading-4 font-medium"
              >
                Adicionar
              </button>
            </div>
            <p className="text-text-secondary text-[14px] leading-[15px]">
              Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.
            </p>
          </div>

          <div className="grid gap-x-7 gap-y-6 sm:grid-cols-2">
            <AccountField label="Nome de exibição" required>
              {({ id }) => (
                <input
                  id={id}
                  defaultValue={profile?.displayName ?? ''}
                  readOnly
                  className={cn(accountInputClass, 'text-sand')}
                />
              )}
            </AccountField>

            <AccountField label="Apelido da carteira" required>
              {({ id }) => (
                <input
                  id={id}
                  name="walletLabel"
                  defaultValue={primary?.label ?? ''}
                  className={accountInputClass}
                />
              )}
            </AccountField>

            <AccountField label="Rede" required>
              {({ id }) => (
                <div className="relative">
                  <select
                    id={id}
                    name="network"
                    defaultValue={primary?.network ?? 'Ethereum Mainnet'}
                    className={cn(accountInputClass, 'appearance-none pr-8')}
                  >
                    {NETWORKS.map((network) => (
                      <option key={network} value={network} className="bg-surface-card text-text">
                        {network}
                      </option>
                    ))}
                  </select>
                  <span
                    aria-hidden
                    className="text-sand pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[10px]"
                  >
                    ▾
                  </span>
                </div>
              )}
            </AccountField>

            <AccountField label="Nome do perfil" required>
              {({ id }) => (
                <input
                  id={id}
                  defaultValue={profile?.username ?? ''}
                  readOnly
                  className={cn(accountInputClass, 'text-sand')}
                />
              )}
            </AccountField>

            <AccountField label="Endereço da carteira" required>
              {({ id }) => (
                <input
                  id={id}
                  defaultValue={primary?.address ?? ''}
                  placeholder="Endereço 0x da carteira"
                  readOnly
                  className={cn(accountInputClass, 'text-sand')}
                />
              )}
            </AccountField>

            <AccountField className="sm:pt-[39px]">
              {({ id }) => (
                <input
                  id={id}
                  placeholder="ENS ou carteira secundária (opcional)"
                  defaultValue={profile?.ensName ?? ''}
                  readOnly
                  className={cn(accountInputClass, 'text-sand')}
                />
              )}
            </AccountField>

            <AccountField label="Tipo de carteira" required>
              {({ id }) => (
                <div className="relative">
                  <select
                    id={id}
                    defaultValue={WALLET_TYPES[0]}
                    className={cn(accountInputClass, 'appearance-none pr-8')}
                  >
                    {WALLET_TYPES.map((type) => (
                      <option key={type} value={type} className="bg-surface-card text-text">
                        {type}
                      </option>
                    ))}
                  </select>
                  <span
                    aria-hidden
                    className="text-sand pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[10px]"
                  >
                    ▾
                  </span>
                </div>
              )}
            </AccountField>

            <AccountField label="Código de indicação" required>
              {({ id }) => <input id={id} className={accountInputClass} />}
            </AccountField>

            <AccountField label="E-mail" required>
              {({ id }) => (
                <input
                  id={id}
                  type="email"
                  defaultValue={profile?.email ?? ''}
                  readOnly
                  className={cn(accountInputClass, 'text-sand')}
                />
              )}
            </AccountField>

            <AccountField label="Nome ENS" required>
              {({ id }) => (
                <div className="flex gap-2.5">
                  <div className="text-text flex h-10 w-[78px] shrink-0 items-center justify-between rounded-field border border-field px-[13px] text-[15px]">
                    .eth
                    <span aria-hidden className="text-[10px]">
                      ▾
                    </span>
                  </div>
                  <input
                    id={id}
                    defaultValue={profile?.ensName ?? ''}
                    readOnly
                    className={cn(accountInputClass, 'flex-1 text-sand')}
                  />
                </div>
              )}
            </AccountField>
          </div>

          {error ? (
            <p role="alert" className="text-error text-[13px]">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={saveWallet.isPending || !primary}
            className="bg-primary text-ink rounded-field h-10 min-w-[131px] self-start px-4 text-[14px] leading-none font-bold whitespace-nowrap disabled:opacity-60"
          >
            Salvar carteira
          </button>
        </form>

        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-text text-[17px] leading-4 font-bold">Carteira secundária</h2>
            <div className="flex items-center gap-4">
              <label className="text-text flex items-center gap-2 text-[14px] leading-[15px]">
                <input
                  type="checkbox"
                  checked={sameAsPrimary}
                  onChange={(event) => setSameAsPrimary(event.target.checked)}
                  className="accent-primary size-4"
                />
                Igual à carteira principal
              </label>
              <button
                type="button"
                onClick={() => setSecondaryOpen(true)}
                className="text-highlight text-[16px] leading-4 font-medium"
              >
                Adicionar
              </button>
            </div>
          </div>

          {secondaries.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {secondaries.map((wallet) => (
                <li key={wallet.id} className="text-text flex items-center justify-between text-[14px]">
                  <span>{wallet.label}</span>
                  <span className="text-sand">{wallet.address}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-text-secondary text-[14px] leading-[15px]">
              Você ainda não adicionou uma carteira secundária.
            </p>
          )}

          {secondaryOpen ? (
            <form
              className="flex flex-col gap-3 sm:flex-row sm:items-end"
              onSubmit={(event) => {
                event.preventDefault()
                const data = new FormData(event.currentTarget)
                const address = sameAsPrimary
                  ? (primary?.address ?? '')
                  : String(data.get('address') ?? '').trim()
                createSecondary.mutate({
                  address,
                  label: String(data.get('label') ?? '').trim() || 'Carteira secundária'
                })
              }}
            >
              <AccountField label="Apelido da secundária" className="flex-1">
                {({ id }) => <input id={id} name="label" className={accountInputClass} />}
              </AccountField>
              <AccountField label="Endereço" className="flex-1">
                {({ id }) => (
                  <input
                    id={id}
                    name="address"
                    defaultValue={primary?.address ?? ''}
                    placeholder="Endereço 0x da carteira"
                    readOnly={sameAsPrimary}
                    className={cn(accountInputClass, sameAsPrimary && 'text-sand')}
                  />
                )}
              </AccountField>
              <button
                type="submit"
                disabled={createSecondary.isPending}
                className="bg-primary text-ink rounded-field h-10 min-w-[131px] px-4 text-[14px] leading-none font-bold whitespace-nowrap disabled:opacity-60"
              >
                Adicionar
              </button>
            </form>
          ) : null}
        </section>
      </div>
    </AccountLayout>
  )
}
