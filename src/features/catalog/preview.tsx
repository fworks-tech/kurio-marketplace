import { useState } from 'react'
import { PackageOpenIcon } from 'lucide-react'
import { toMicro } from '@/shared/api/money'
import { SiteHeader } from '@/shared/ui/layout/site-header'
import { SiteFooter } from '@/shared/ui/layout/site-footer'
import { MobileTabBar } from '@/shared/ui/layout/mobile-tab-bar'
import { MobileScreenHeader } from '@/shared/ui/layout/mobile-screen-header'
import { AuthLayout } from '@/shared/ui/layout/auth-layout'
import { Breadcrumb } from '@/shared/ui/breadcrumb'
import { EmptyState } from '@/shared/ui/empty-state'
import { ErrorState } from '@/shared/ui/error-state'
import { PriceDisplay } from '@/shared/ui/price-display'
import { SocialButton } from '@/shared/ui/social-button'
import { InlineLink } from '@/shared/ui/inline-link'
import { FormField } from '@/shared/ui/form-field'
import { FormSection } from '@/shared/ui/form-section'
import { Input } from '@/components/ui/input'
import { Divider } from '@/components/ui/divider'
import { PasswordField } from '@/components/ui/password-field'
import { RowSkeleton, SummarySkeleton, FormSkeleton } from '@/shared/ui/skeletons'
import { ConnectionBanner } from '@/shared/ui/connection-banner'
import { RequireAuth } from '@/shared/ui/require-auth'
import { useAnnounce } from '@/shared/ui/live-region'
import { notify } from '@/shared/ui/toast'
import { Button } from '@/components/ui/button'
import { NftGrid } from '@/features/catalog/components/nft-grid'
import { SearchField } from '@/features/catalog/components/search-field'
import { SortSelect } from '@/features/catalog/components/sort-select'
import { CatalogTabs } from '@/features/catalog/components/catalog-tabs'
import { CatalogPagination } from '@/features/catalog/components/catalog-pagination'
import { FilterSidebar } from '@/features/catalog/components/filter-sidebar'
import { AvatarUploader } from '@/features/account/components/avatar-uploader'
import { ProfileSidebar } from '@/features/account/components/profile-sidebar'
import { Gallery } from '@/features/detail/components/gallery'
import { EditionSelector } from '@/features/detail/components/edition-selector'
import { QuantityStepper } from '@/features/detail/components/quantity-stepper'
import { RatingSummary } from '@/features/detail/components/rating-summary'
import { ReviewList } from '@/features/detail/components/review-list'
import { DetailTabs } from '@/features/detail/components/detail-tabs'
import { ShareActions } from '@/features/detail/components/share-actions'
import { CartItemRow } from '@/features/cart/components/cart-item-row'
import { CouponField } from '@/features/cart/components/coupon-field'
import { OrderSummary } from '@/features/payment/components/order-summary'
import { QuoteChangeNotice } from '@/features/payment/components/quote-change-notice'
import { ConfirmBar } from '@/features/payment/components/confirm-bar'
import { OrderStatusBadge } from '@/features/payment/components/order-status-badge'
import { WalletCard } from '@/features/wallet/components/wallet-card'
import { WalletOptionRow } from '@/features/wallet/components/wallet-option-row'
import { NetworkSelect } from '@/features/wallet/components/network-select'
import { ConnectionStatus } from '@/features/wallet/components/connection-status'
import type { CatalogFacets, CatalogFilterValues, CatalogNft, CatalogOption } from '@/features/catalog/catalog-types'
import type { Wallet } from '@/shared/api/api-types'

const NFTS: CatalogNft[] = [
  { id: '1', title: 'Cyberpunk Ape #1', imageUrl: 'https://picsum.photos/seed/ape/400', priceEth: '2.5', collection: 'Cyber Apes', badges: ['raro', 'destaque'], isFavorite: true, isAvailable: true },
  { id: '2', title: 'Solar Flare Dragon', imageUrl: 'https://picsum.photos/seed/dragon/400', priceEth: '8.75', collection: 'Solar Flares', badges: ['oferta-limitada'], previousPriceEth: '10.0', isAvailable: true },
  { id: '3', title: 'Midnight Lotus', imageUrl: 'https://picsum.photos/seed/lotus/400', priceEth: '1.2', collection: 'Lotus', isAvailable: true },
  { id: '4', title: 'Golden Dragon #5', imageUrl: 'https://picsum.photos/seed/gold/400', priceEth: '0', collection: 'Dragons', isAvailable: false }
]

const TABS: CatalogOption[] = [
  { value: 'todos', label: 'Todos os NFTs' },
  { value: 'novos', label: 'Novos lançamentos' },
  { value: 'alta', label: 'Em alta' }
]
const SORTS: CatalogOption[] = [
  { value: 'newest', label: 'Listados recentemente' },
  { value: 'price_asc', label: 'Menor preço' },
  { value: 'price_desc', label: 'Maior preço' }
]
const NETWORKS: CatalogOption[] = [
  { value: 'ethereum', label: 'Ethereum' },
  { value: 'polygon', label: 'Polygon' },
  { value: 'base', label: 'Base' }
]
const FACETS: CatalogFacets = {
  collections: [{ value: 'cyber', label: 'Cyber Apes', count: 12 }],
  networks: [{ value: 'ethereum', label: 'Ethereum', count: 40 }]
}
const BOUNDS = { min: toMicro('0'), max: toMicro('12.3') }
const GALLERY = [
  { src: 'https://picsum.photos/seed/g0/600', alt: 'Arte principal do NFT Cyberpunk Ape' },
  { src: 'https://picsum.photos/seed/g1/600', alt: 'Variação de fundo' },
  { src: 'https://picsum.photos/seed/g2/600', alt: 'Detalhe da textura' }
]
const WALLETS: Wallet[] = [
  { id: 'w1', address: '0x7aB8f1c2d3e4a5b6c7d8e9f0a1b2c3d4e5f69f3D', label: 'Carteira principal', network: 'Ethereum Mainnet', isPrimary: true },
  { id: 'w2', address: 'colecionador.eth', label: 'ENS pessoal', network: 'Polygon', isPrimary: false }
]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 border-white/10 border-t pt-6">
      <h2 className="text-lg font-bold">{title}</h2>
      {children}
    </section>
  )
}

export default function CatalogPreview() {
  const { announce, announceAlert } = useAnnounce()
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('newest')
  const [tab, setTab] = useState('todos')
  const [page, setPage] = useState(4)
  const [loading, setLoading] = useState(false)
  const [empty, setEmpty] = useState(false)
  const [favorite, setFavorite] = useState<Set<string>>(new Set(['1']))
  const [filters, setFilters] = useState<CatalogFilterValues>({ search: '' })

  const [edition, setEdition] = useState('1/10')
  const [qty, setQty] = useState(1)
  const [galleryIndex, setGalleryIndex] = useState(0)
  const [coupon, setCoupon] = useState('')
  const [cartQty, setCartQty] = useState(2)
  const [wallet, setWallet] = useState('w1')
  const [network, setNetwork] = useState('ethereum')
  const [avatar, setAvatar] = useState<string | null>(null)

  const toggleFavorite = (id: string) =>
    setFavorite((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <div className="bg-bg text-text min-h-dvh">
      <SiteHeader isAuthenticated cartCount={3} accountLabel="colecionador" onSignOut={() => notify.info('Sessão encerrada (demo).')} />
      <ConnectionBanner status="offline" onReconnect={() => announce('Reconectando…')} />
      <MobileScreenHeader title="Prévia de componentes" className="md:hidden" />

      <main className="mx-auto max-w-[1248px] space-y-10 px-4 py-8 pb-24 sm:px-6">
        <Section title="Trilha de navegação">
          <Breadcrumb items={[{ label: 'Início', to: '/' }, { label: 'Mercado', to: '/' }, { label: 'Cyberpunk Ape #1' }]} />
        </Section>

        <Section title="Preço">
          <div className="flex flex-wrap items-center gap-6">
            <PriceDisplay value="1.19" />
            <PriceDisplay value="26.846000" />
            <PriceDisplay value="0" size="sm" />
          </div>
        </Section>

        <Section title="Catálogo">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setLoading((v) => !v)}>{loading ? 'Ocultar loading' : 'Mostrar loading'}</Button>
            <Button variant="outline" size="sm" onClick={() => setEmpty((v) => !v)}>{empty ? 'Ocultar vazio' : 'Mostrar vazio'}</Button>
          </div>
          <div className="flex flex-col gap-4 lg:flex-row">
            <FilterSidebar facets={FACETS} values={filters} bounds={BOUNDS} onChange={(patch) => setFilters((p) => ({ ...p, ...patch }))} />
            <div className="min-w-0 flex-1 space-y-4">
              <CatalogTabs value={tab} options={TABS} onChange={setTab} />
              <div className="flex flex-wrap items-center gap-3">
                <SearchField value={search} onChange={setSearch} label="Buscar NFT" className="max-w-xs" />
                <SortSelect value={sort} options={SORTS} onChange={setSort} />
              </div>
              {loading ? <NftGrid loading skeletonCount={4} /> : empty ? <NftGrid items={[]} emptyTitle="Nenhum resultado" onClearFilters={() => setEmpty(false)} /> : (
                <NftGrid items={NFTS.map((n) => ({ ...n, isFavorite: favorite.has(n.id) }))} onToggleFavorite={toggleFavorite} />
              )}
              <CatalogPagination page={page} totalPages={12} onChange={setPage} />
            </div>
          </div>
        </Section>

        <Section title="Detalhe">
          <div className="grid gap-6 md:grid-cols-2">
            <Gallery images={GALLERY} index={galleryIndex} onIndexChange={setGalleryIndex} />
            <div className="space-y-5">
              <EditionSelector
                value={edition}
                onSelect={setEdition}
                options={[
                  { value: '1/1', label: '1/1', disabled: true, reason: 'Edição única vendida' },
                  { value: '1/10', label: '1/10' },
                  { value: '1/50', label: '1/50', disabled: true, reason: 'Esgotada' }
                ]}
              />
              <QuantityStepper value={qty} max={10} onChange={setQty} />
              <RatingSummary value={4.8} count={19} />
              <RatingSummary value={4.8} count={19} variant="mobile" />
              <ShareActions onCopyLink={() => notify.success('Link copiado.')} />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => announce('Atualização anunciada ao leitor de tela.')}>Anunciar (live region)</Button>
                <Button size="sm" variant="destructive" onClick={() => announceAlert('Alerta urgente anunciado.')}>Alertar</Button>
              </div>
            </div>
          </div>
          <DetailTabs
            value={tab}
            onChange={setTab}
            tabs={[
              { value: 'todos', label: 'Avaliações', content: <ReviewList reviews={[{ id: 'r1', author: 'nova.eth', rating: 5, date: '12 jan 2026', text: 'Curadoria impecável, entrega rápida.' }, { id: 'r2', author: '0x9f3D', rating: 4, text: 'Ótima arte, taxa de rede um pouco alta.' }]} /> },
              { value: 'novos', label: 'Detalhes', content: <p className="text-text-secondary text-sm">Atributos e histórico de edições.</p> },
              { value: 'alta', label: 'Atividade', content: <p className="text-text-secondary text-sm">Sem atividade recente.</p> }
            ]}
          />
        </Section>

        <Section title="Carrinho e pagamento">
          <div className="space-y-2">
            <CartItemRow image="https://picsum.photos/seed/ape/200" title="Cyberpunk Ape #1" tokenId="1024" priceEth="2.5" lineTotalEth="5.0" quantity={cartQty} max={10} onQuantityChange={setCartQty} onRemove={() => notify.info('Item removido (demo).')} />
            <RowSkeleton />
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <CouponField value={coupon} onChange={setCoupon} onApply={() => { if (coupon === 'OFF') setCoupon(''); }} status="idle" />
              <CouponField value="" onChange={() => undefined} onApply={() => undefined} status="applied" appliedCode="BEMVINDO" onRemove={() => undefined} />
              <CouponField value="XX" onChange={() => undefined} onApply={() => undefined} status="error" message="Cupom inválido ou expirado." />
              <OrderSummary subtotalEth="5.0" discountEth="0.5" networkFeeEth="0.021" totalEth="4.521" />
              <SummarySkeleton />
              <OrderSummary subtotalEth="5.0" networkFeeEth="0.021" totalEth="5.021" loading />
              <QuoteChangeNotice changes={['O preço dos itens mudou.', 'A taxa de rede mudou.']} onConfirm={() => notify.success('Orçamento revalidado.')} />
            </div>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <OrderStatusBadge status="pending" />
                <OrderStatusBadge status="confirmed" />
                <OrderStatusBadge status="rejected" />
              </div>
              <ConfirmBar totalEth="4.521" actionLabel="Pagar agora" onConfirm={() => notify.info('Pedido confirmado (demo).')} className="rounded-card border border-white/10" />
            </div>
          </div>
        </Section>

        <Section title="Carteira">
          <div className="grid gap-6 md:grid-cols-2">
            <div role="radiogroup" aria-label="Carteiras" className="space-y-2">
              {WALLETS.map((w) => (
                <WalletCard key={w.id} wallet={w} selected={wallet === w.id} onSelect={setWallet} onRemove={(id) => notify.info(`Carteira ${id} removida (demo).`)} />
              ))}
            </div>
            <div className="space-y-4">
              <div role="radiogroup" aria-label="Provedores" className="space-y-2">
                <WalletOptionRow id="metamask" label="MetaMask" selected={false} onSelect={() => undefined} mark={<span aria-hidden className="bg-highlight size-6 rounded-full" />} />
                <WalletOptionRow id="phantom" label="Phantom" selected onSelect={() => undefined} mark={<span aria-hidden className="bg-primary size-6 rounded-full" />} />
              </div>
              <NetworkSelect value={network} options={NETWORKS} onChange={setNetwork} />
              <NetworkSelect value="" options={NETWORKS} onChange={() => undefined} error="Rede incompatível com a carteira." />
              <ConnectionStatus status="connected" />
              <ConnectionStatus status="refused" onRetry={() => notify.info('Tentando reconectar…')} />
            </div>
          </div>
        </Section>

        <Section title="Conta e formulários">
          <div className="grid gap-6 md:grid-cols-2">
            <AvatarUploader value={avatar} onChange={setAvatar} />
            <ProfileSidebar active="perfil" onSelect={(to) => notify.info(`Ir para ${to}`)} onSignOut={() => notify.info('Saindo (demo).')} />
            <FormSection title="Segurança" description="Alterações de senha.">
              <FormField label="Senha atual">
                {(s) => <PasswordField id={s.id} aria-describedby={s.describedBy} autoComplete="current-password" />}
              </FormField>
              <FormField label="Nova senha" hint="Mínimo de 8 caracteres." error="A nova senha deve ter ao menos 8 caracteres.">
                {(s) => <PasswordField id={s.id} aria-describedby={s.describedBy} aria-invalid={s.invalid || undefined} autoComplete="new-password" />}
              </FormField>
            </FormSection>
            <div className="space-y-4">
              <FormSkeleton />
              <RequireAuth authenticated={false}>
                <p>Conteúdo protegido</p>
              </RequireAuth>
            </div>
          </div>
        </Section>

        <Section title="Login">
          <AuthLayout title="Entrar" description="Acesse sua conta Kurio.">
            <div className="space-y-3">
              <SocialButton provider="google" onClick={() => notify.info('Google (demo).')} />
              <SocialButton provider="facebook" onClick={() => notify.info('Facebook (demo).')} />
              <Divider>ou</Divider>
              <FormField label="E-mail">
                {(s) => <Input id={s.id} type="email" aria-describedby={s.describedBy} placeholder="voce@email.com" />}
              </FormField>
              <FormField label="Senha">
                {(s) => <PasswordField id={s.id} aria-describedby={s.describedBy} />}
              </FormField>
              <Button className="w-full">Entrar</Button>
              <InlineLink before="Novo por aqui?" linkText="Criar conta" to="/signup" />
              <InlineLink linkText="Esqueci minha senha" onClick={() => notify.info('Recuperação (demo).')} />
            </div>
          </AuthLayout>
        </Section>

        <Section title="Estados">
          <div className="grid gap-4 md:grid-cols-2">
            <EmptyState title="Carrinho vazio" description="Adicione NFTs para continuar." actionLabel="Explorar" icon={<PackageOpenIcon className="size-8" />} />
            <ErrorState message="Não foi possível carregar." onRetry={() => undefined} />
          </div>
        </Section>
      </main>

      <SiteFooter />
      <MobileTabBar active="inicio" className="md:hidden" />
    </div>
  )
}
