import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { orderService, quoteService } from '@/shared/services'
import { generateIdempotencyKey } from '@/shared/api/http-client'
import { ApiError } from '@/shared/api/api-error'
import { describeQuoteChanges, diffQuote } from '@/shared/lib/quote-diff'
import { notify } from '@/shared/ui/toast'
import { Breadcrumb } from '@/shared/ui/breadcrumb'
import { formatTokenId } from '@/shared/lib/format'
import { ErrorState } from '@/shared/ui/error-state'
import { PriceDisplay } from '@/shared/ui/price-display'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useCart } from '@/features/cart/cart-queries'
import { useSession } from '@/features/session/session-queries'
import { ConfirmBar } from './components/confirm-bar'
import { OrderSummary } from './components/order-summary'
import { QuoteChangeNotice } from './components/quote-change-notice'
import {
  WalletNetworkPicker,
  WALLET_OPTIONS,
  type WalletOption
} from './components/wallet-network-picker'
import { useWalletConnection } from './use-wallet-connection'
import { CHECKOUT_NETWORKS, checkoutQuoteKey, useCheckoutQuote, useWallets } from './payment-queries'
import type { QuoteNetwork } from '@/shared/api/api-types'

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/
const EMAIL_RE = /[^@\s]+@[^@\s]+\.[^@\s]+/

interface PaymentScreenProps {
  onPlaced: (orderId: string) => void
}

/**
 * Figma `Desktop / Pagamento`: 763px form with two 370px sub-columns (24px gutter,
 * 69px fields on an 81px rhythm) and a 405px summary that ends with the
 * `Carteira e rede` options and the 405x45 confirm button.
 */
function CheckoutField({
  label,
  required,
  htmlFor,
  error,
  children
}: {
  label?: string
  required?: boolean
  htmlFor?: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className="w-full">
      <div className="flex h-[29px] items-center gap-1">
        {label ? (
          <label htmlFor={htmlFor} className="text-canvas text-[15px] leading-[15px]">
            {label}
          </label>
        ) : null}
        {required ? (
          <span aria-hidden className="text-error text-[22px] leading-[29px]">
            *
          </span>
        ) : null}
      </div>
      {children}
      {error ? (
        <p role="alert" className="text-error mt-1 text-xs">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export function PaymentScreen({ onPlaced }: PaymentScreenProps) {
  const cart = useCart()
  const wallets = useWallets()
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const cartKey = session?.user.id ?? 'anonymous'

  const [network, setNetwork] = useState<QuoteNetwork>('ethereum')
  const quote = useCheckoutQuote(network)
  const [email, setEmail] = useState('')
  const [manualWallet, setManualWallet] = useState(false)
  const [walletAddress, setWalletAddress] = useState('')
  const [walletType, setWalletType] = useState<WalletOption>('MetaMask')
  const walletConnection = useWalletConnection()
  useEffect(() => {
    if (walletConnection.status !== 'connected' || !walletConnection.address) return
    // A connected wallet owns the address, so it is shown read-write instead of a saved one.
    setManualWallet(true)
    setWalletAddress(walletConnection.address)
  }, [walletConnection.status, walletConnection.address])

  const [profile, setProfile] = useState({
    displayName: '',
    username: '',
    profileName: '',
    ens: '',
    referral: ''
  })
  const [ensSuffix, setEnsSuffix] = useState('.eth')
  const [note, setNote] = useState('')
  const [terms, setTerms] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // A quote change must be acknowledged before submitting (README: explicit re-confirmation).
  const [changes, setChanges] = useState<string[]>([])
  const [acknowledged, setAcknowledged] = useState(false)
  const [checking, setChecking] = useState(false)

  // Pre-fill the collector profile from the session, as the frame shows a filled form.
  useEffect(() => {
    if (!session?.user) return
    setProfile((prev) => ({
      displayName: prev.displayName || session.user.displayName || '',
      username: prev.username || session.user.username || '',
      profileName: prev.profileName || session.user.displayName || '',
      ens: prev.ens || session.user.ensName || '',
      referral: prev.referral
    }))
    setEmail((prev) => prev || session.user.email || '')
  }, [session])

  // A signed-in collector already picked a primary wallet, so the checkout defaults
  // to it instead of asking for a choice the account has made.
  useEffect(() => {
    if (manualWallet || walletAddress) return
    const primary = wallets.data?.[0]
    if (primary) setWalletAddress(primary.address)
  }, [wallets.data, manualWallet, walletAddress])

  // Key is generated once per attempt so repeated clicks and timeouts replay the same order.
  const [attemptKey] = useState(generateIdempotencyKey)
  const placeOrder = useMutation({
    mutationFn: () => orderService.create({ network }, { idempotencyKey: attemptKey }),
    onSuccess: (order) => {
      void queryClient.invalidateQueries({ queryKey: ['cart'] })
      onPlaced(order.id)
    },
    onError: (error) => {
      notify.error(error instanceof ApiError ? error.message : 'Não foi possível concluir a compra.')
    }
  })

  const items = cart.data ?? []
  const shown = quote.data

  const validateForm = (): boolean => {
    const next: Record<string, string> = {}
    if (!EMAIL_RE.test(email)) next.email = 'Informe um e-mail válido.'
    if (!manualWallet && !walletAddress) next.wallet = 'Selecione uma carteira.'
    if (manualWallet && !ADDRESS_RE.test(walletAddress)) next.wallet = 'Endereço 0x inválido (42 caracteres).'
    if (!terms) next.terms = 'É necessário aceitar os termos.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const confirm = async () => {
    // Second stage: the user already reviewed the change notice, so submit.
    if (changes.length > 0 && acknowledged) {
      placeOrder.mutate()
      return
    }
    if (!validateForm()) return
    setChecking(true)
    try {
      const fresh = await quoteService.create({ network })
      const diffs = shown ? describeQuoteChanges(diffQuote(shown, fresh)) : []
      if (diffs.length > 0) {
        queryClient.setQueryData(checkoutQuoteKey(cartKey, network), fresh)
        setChanges(diffs)
        setAcknowledged(false)
        return
      }
      setChanges([])
      placeOrder.mutate()
    } catch (error) {
      setErrors({ general: error instanceof ApiError ? error.message : 'Falha ao revalidar o orçamento.' })
    } finally {
      setChecking(false)
    }
  }

  if (cart.isLoading || quote.isLoading) {
    return (
      <main className="mx-auto max-w-[1248px] px-7 pt-8 pb-[132px] sm:px-6 lg:pb-8">
        <h1 className="sr-only">Pagamento</h1>
        <p className="text-text-secondary mt-2 text-sm">Preparando seu checkout…</p>
      </main>
    )
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-[1248px] px-7 pt-8 pb-[132px] sm:px-6 lg:pb-8">
        <h1 className="sr-only">Pagamento</h1>
        <ErrorState message="Seu carrinho está vazio. Adicione um NFT antes de ir para o pagamento." />
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-[1248px] px-7 pt-8 pb-[132px] sm:px-6 lg:pb-8">
      <Breadcrumb
        items={[
          { label: 'Início', to: '/' },
          { label: 'Mercado', to: '/' },
          { label: 'Pagamento' }
        ]}
      />
      <h1 className="sr-only">Pagamento</h1>

      <div className="mt-4 grid gap-8 lg:grid-cols-[763px_405px] lg:justify-between">
        <section aria-label="Perfil do colecionador">
          <h2 className="text-[17px] leading-4 font-bold">Perfil do colecionador</h2>

          <div className="mt-5 grid gap-x-6 gap-y-3 sm:grid-cols-2">
            <CheckoutField label="Nome de exibição" required htmlFor="co-display">
              <Input
                id="co-display"
                className="h-10 rounded-[3px] text-sm"
                value={profile.displayName}
                onChange={(e) => setProfile((p) => ({ ...p, displayName: e.target.value }))}
              />
            </CheckoutField>

            <CheckoutField label="Nome de usuário" required htmlFor="co-username">
              <Input
                id="co-username"
                className="h-10 rounded-[3px] text-sm"
                value={profile.username}
                onChange={(e) => setProfile((p) => ({ ...p, username: e.target.value }))}
              />
            </CheckoutField>

            <CheckoutField label="Rede" required htmlFor="co-network">
              <Select
                value={network}
                onValueChange={(value) => {
                  setNetwork(value as QuoteNetwork)
                  setChanges([])
                  setAcknowledged(false)
                }}
              >
                <SelectTrigger id="co-network" className="!h-10 w-full rounded-[3px] text-sm">
                  <SelectValue placeholder="Selecione uma rede" />
                </SelectTrigger>
                <SelectContent>
                  {CHECKOUT_NETWORKS.map((net) => (
                    <SelectItem key={net} value={net}>
                      {net}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CheckoutField>

            <CheckoutField label="Nome do perfil" required htmlFor="co-profile">
              <Input
                id="co-profile"
                className="h-10 rounded-[3px] text-sm"
                value={profile.profileName}
                onChange={(e) => setProfile((p) => ({ ...p, profileName: e.target.value }))}
              />
            </CheckoutField>

            <CheckoutField label="Endereço da carteira" required htmlFor="co-wallet" error={errors.wallet}>
              {wallets.data?.length && !manualWallet ? (
                <Select value={walletAddress} onValueChange={setWalletAddress}>
                  <SelectTrigger id="co-wallet" className="!h-10 w-full rounded-[3px] text-sm">
                    <SelectValue placeholder="Endereço 0x da carteira" />
                  </SelectTrigger>
                  <SelectContent>
                    {wallets.data.map((w) => (
                      <SelectItem key={w.id} value={w.address}>
                        {w.label} · {w.address.slice(0, 6)}…{w.address.slice(-4)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="co-wallet"
                  className="h-10 rounded-[3px] text-sm"
                  value={walletAddress}
                  placeholder="Endereço 0x da carteira"
                  onChange={(e) => setWalletAddress(e.target.value)}
                />
              )}
            </CheckoutField>

            <CheckoutField htmlFor="co-ens-alt">
              <Input
                id="co-ens-alt"
                className="h-10 rounded-[3px] text-sm"
                value={profile.ens}
                placeholder="ENS ou carteira secundária (opcional)"
                onChange={(e) => setProfile((p) => ({ ...p, ens: e.target.value }))}
              />
            </CheckoutField>

            <CheckoutField label="Tipo de carteira" required htmlFor="co-wallet-type">
              <Select value={walletType} onValueChange={(v) => setWalletType(v as WalletOption)}>
                <SelectTrigger id="co-wallet-type" className="!h-10 w-full rounded-[3px] text-sm">
                  <SelectValue placeholder="Selecione uma carteira" />
                </SelectTrigger>
                <SelectContent>
                  {WALLET_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CheckoutField>

            <CheckoutField label="Código de indicação" required htmlFor="co-referral">
              <Input
                id="co-referral"
                className="h-10 rounded-[3px] text-sm"
                value={profile.referral}
                onChange={(e) => setProfile((p) => ({ ...p, referral: e.target.value }))}
              />
            </CheckoutField>

            <CheckoutField label="E-mail" required htmlFor="co-email" error={errors.email}>
              <Input
                id="co-email"
                type="email"
                className="h-10 rounded-[3px] text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </CheckoutField>

            <CheckoutField label="Nome ENS" required htmlFor="co-ens">
              <Select value={ensSuffix} onValueChange={setEnsSuffix}>
                <SelectTrigger id="co-ens" className="!h-10 w-[92px] rounded-[3px] text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=".eth">.eth</SelectItem>
                  <SelectItem value=".sol">.sol</SelectItem>
                </SelectContent>
              </Select>
            </CheckoutField>
          </div>

          <button
            type="button"
            onClick={() => {
              setManualWallet((prev) => !prev)
              setWalletAddress('')
            }}
            className="text-canvas mt-5 flex items-center gap-3 text-[15px] leading-5 hover:underline"
          >
            <span
              aria-hidden
              className={
                'size-[15px] shrink-0 rounded-full border ' +
                (manualWallet ? 'border-primary bg-primary' : 'border-primary')
              }
            />
            {manualWallet ? 'Usar carteira conectada' : 'Usar outra carteira?'}
          </button>

          <div className="mt-4 w-[350px] max-w-full">
            <label htmlFor="co-note" className="text-canvas text-[15px] leading-[15px]">
              Observação do colecionador (opcional)
            </label>
            <textarea
              id="co-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="bg-surface-field text-canvas mt-3 h-[152px] w-full resize-none rounded-[3px] p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            />
          </div>

          <label className="mt-6 flex items-start gap-2 text-sm">
            <Checkbox checked={terms} onCheckedChange={(c) => setTerms(Boolean(c))} />
            <span>
              Li e aceito os termos de uso e a política de privacidade.
              {errors.terms ? <span className="text-error block">{errors.terms}</span> : null}
            </span>
          </label>

          {errors.general ? (
            <p role="alert" className="text-error mt-3 text-sm">
              {errors.general}
            </p>
          ) : null}
        </section>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <h2 className="text-[17px] leading-4 font-bold">Seus NFTs</h2>

          <div className="mt-4 flex items-center justify-between border-b border-primary pb-2 text-base">
            <span className="font-bold">NFTs</span>
            <span className="font-medium">Subtotal</span>
          </div>

          <ul className="mt-3 space-y-3">
            {items.map((item) => (
              <li
                key={item.nftId}
                className="bg-surface-card flex h-[70px] items-center gap-3 rounded-[4px] p-1"
              >
                <img
                  src={item.nft.imageUrl}
                  alt=""
                  className="size-[70px] shrink-0 rounded-[4px] object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-canvas truncate text-base leading-4 font-bold">
                    {item.nft.title}
                  </p>
                  <p className="text-sand mt-1 text-sm leading-4">
                    ID do token: {formatTokenId(item.nft.id)}
                  </p>
                  <p className="text-text-secondary text-xs leading-4">
                    Edição {item.nft.edition}/{item.nft.totalEdition} · Qtd. {item.quantity}
                  </p>
                </div>
                <PriceDisplay
                  value={item.total}
                  className="text-canvas shrink-0 pr-2 text-base leading-4 font-bold"
                />
              </li>
            ))}
          </ul>

          <p className="text-canvas mt-4 text-sm leading-4">
            Tem um código promocional? Aplique aqui
          </p>

          <QuoteChangeNotice
            changes={acknowledged ? [] : changes}
            onConfirm={() => setAcknowledged(true)}
          />

          <OrderSummary
            updating={quote.isFetching}
            subtotalEth={shown?.subtotal ?? '0'}
            discountEth={shown && Number(shown.discount) > 0 ? shown.discount : undefined}
            networkFeeEth={shown?.networkFee ?? '0'}
            totalEth={shown?.total ?? '0'}
          />

          <p className="text-text-secondary mt-3 text-xs">
            Pagando com{' '}
            <span className="font-semibold tabular-nums">
              <PriceDisplay value={shown?.total ?? '0'} />
            </span>{' '}
            via {network}.
          </p>

          <WalletNetworkPicker
            value={walletType}
            onChange={(next) => {
              walletConnection.disconnect()
              setWalletType(next)
            }}
            className="mt-6"
            connection={{
              status: walletConnection.status,
              wallet: walletConnection.wallet,
              address: walletConnection.address,
              onConnect: () => walletConnection.connect(walletType),
              onApprove: walletConnection.approve,
              onRefuse: walletConnection.refuse,
              onDisconnect: walletConnection.disconnect,
              onRetry: walletConnection.retry
            }}
          />

          <Button
            className="mt-6 hidden h-[45px] w-full rounded-[8px] text-[15px] font-bold lg:inline-flex"
            onClick={confirm}
            disabled={!shown || checking || placeOrder.isPending}
          >
            {checking || placeOrder.isPending ? 'Confirmando…' : 'Confirmar compra'}
          </Button>
        </aside>
      </div>

      <div className="mt-8 lg:hidden">
        <ConfirmBar
          totalEth={shown?.total ?? '0'}
          actionLabel="Confirmar compra"
          onConfirm={confirm}
          loading={checking || placeOrder.isPending}
          disabled={!shown}
        />
      </div>
    </main>
  )
}
