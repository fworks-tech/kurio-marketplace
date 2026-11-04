import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { EyeIcon, FlagIcon, GemIcon, HeartIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PriceDisplay } from '@/shared/ui/price-display'
import { notify } from '@/shared/ui/toast'
import { ErrorState } from '@/shared/ui/error-state'
import { Skeleton } from '@/shared/ui/skeleton'
import { Gallery } from './components/gallery'
import { DetailTabs } from './components/detail-tabs'
import { QuantityStepper } from './components/quantity-stepper'
import { ShareActions } from './components/share-actions'
import { NftGrid } from '@/features/catalog/components/nft-grid'
import { useFavorites, useToggleFavorite } from '@/features/favorites/use-toggle-favorite'
import { useSession } from '@/features/session/session-queries'
import { useAddToCart } from '@/features/cart/cart-queries'
import { addGuestItem } from '@/features/cart/guest-cart'
import { remainingEditions, useNftDetail, useRelatedNfts } from './detail-queries'

interface ItemDetailScreenProps {
  nftId: string
  onRequireAuth: () => void
}

export function ItemDetailScreen({ nftId, onRequireAuth }: ItemDetailScreenProps) {
  const detail = useNftDetail(nftId)
  const related = useRelatedNfts(nftId)
  const { data: session } = useSession()
  const favorites = useFavorites()
  const toggleFavorite = useToggleFavorite(nftId)
  const addToCart = useAddToCart()
  const [quantity, setQuantity] = useState(1)

  if (detail.isLoading) return <DetailSkeleton />
  if (detail.isError) {
    return (
      <Shell>
        <ErrorState message="Não foi possível carregar este NFT." onRetry={() => detail.refetch()} />
      </Shell>
    )
  }
  if (!detail.data) {
    return (
      <Shell>
        <h1 className="text-2xl font-bold">NFT não encontrado</h1>
        <p className="text-text-secondary mt-2 text-sm">O item que você procura não existe ou saiu do ar.</p>
        <Link to="/" className="mt-4 inline-block text-sm font-semibold underline">
          Voltar ao mercado
        </Link>
      </Shell>
    )
  }

  const nft = detail.data
  const remaining = remainingEditions(nft)
  const soldOut = !nft.isAvailable || remaining === 0
  const isFavorite = session
    ? (favorites.data?.favorites ?? []).some((f) => f.id === nftId)
    : nft.isFavorite

  const handleFavorite = () => {
    if (!session) return onRequireAuth()
    toggleFavorite.mutate(isFavorite)
  }

  const handleAddToCart = () => {
    if (!session) {
      addGuestItem(nftId, quantity)
      notify.success('Salvo no carrinho. Entre para finalizar a compra.')
      return
    }
    addToCart.mutate(
      { nftId, quantity },
      { onSuccess: () => notify.success('Adicionado ao carrinho.') }
    )
  }

  const tabs = [
    { value: 'descricao', label: 'Descrição', content: <p className="text-sm">{nft.description}</p> },
    {
      value: 'atributos',
      label: 'Atributos',
      content: nft.attributes?.length ? (
        <dl className="grid grid-cols-2 gap-3">
          {nft.attributes.map((attr) => (
            <div key={attr.traitType} className="bg-surface-raised rounded-card p-3">
              <dt className="text-text-secondary text-xs uppercase">{attr.traitType}</dt>
              <dd className="mt-1 text-sm font-semibold">{String(attr.value)}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-text-secondary text-sm">Sem atributos para este NFT.</p>
      )
    }
  ]

  return (
    <main className="mx-auto max-w-[1248px] px-4 py-8 sm:px-6">
      <Link to="/" className="text-text-secondary mb-6 inline-block text-sm hover:underline">
        ← Voltar ao mercado
      </Link>
      <div className="grid gap-8 lg:grid-cols-[573px_1fr]">
        <Gallery images={[{ src: nft.imageUrl, alt: nft.title }]} />

        <div className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-[28px] leading-[37px] font-bold">{nft.title}</h1>
              {nft.collectionId ? (
                <p className="text-text-secondary mt-1 text-sm">{nft.collectionId}</p>
              ) : null}
            </div>
            <button
              type="button"
              aria-pressed={isFavorite}
              aria-label={isFavorite ? 'Remover dos favoritos' : 'Favoritar'}
              onClick={handleFavorite}
              className="bg-surface-card hover:bg-surface-raised rounded-full border border-white/10 p-2"
            >
              <HeartIcon className={isFavorite ? 'fill-highlight text-highlight size-5' : 'size-5'} />
            </button>
          </div>

          <div className="bg-surface-card flex flex-wrap items-end justify-between gap-4 rounded-card border border-white/10 p-4">
            <div>
              <p className="text-text-secondary text-xs">Preço</p>
              <PriceDisplay value={nft.price} size="lg" />
            </div>
            <p className="text-text-secondary text-sm">
              {soldOut ? (
                <span className="font-semibold">Esgotado</span>
              ) : (
                <>
                  <span className="font-semibold">{remaining}</span> de {nft.totalEdition} edições
                </>
              )}
            </p>
          </div>

          <StatsRow
            views={nft.stats.viewCount}
            bids={nft.stats.bidCount}
            floorPrice={nft.stats.floorPrice}
            royalty={nft.royalty}
          />

          <DetailTabs tabs={tabs} value="descricao" onChange={() => undefined} />

          {!soldOut ? (
            <div className="flex flex-wrap items-center gap-3">
              <QuantityStepper value={quantity} max={remaining} onChange={setQuantity} />
              <Button onClick={handleAddToCart} disabled={addToCart.isPending}>
                {addToCart.isPending ? 'Adicionando…' : 'Adicionar ao carrinho'}
              </Button>
            </div>
          ) : null}

          <ShareActions
            onCopyLink={() => {
              void navigator.clipboard
                .writeText(window.location.href)
                .then(() => notify.success('Link copiado.'))
                .catch(() => notify.error('Não foi possível copiar o link.'))
            }}
          />
        </div>
      </div>

      <section aria-labelledby="detalhes-heading" className="mt-12">
        <h2 id="detalhes-heading" className="text-primary text-[17px] leading-4 font-bold">
          Detalhes do NFT
        </h2>
        <p className="text-sandish mt-4 max-w-[1200px] text-sm leading-6">{nft.description}</p>
        <dl className="mt-4 text-sm leading-6">
          <dt className="text-canvas font-bold">Rede:</dt>
          <dd className="text-sandish">
            Cunhado na Ethereum com procedência imutável e metadados armazenados no IPFS.
          </dd>
          <dt className="text-canvas font-bold">Contrato:</dt>
          <dd className="text-sandish">
            Royalty do criador: {nft.royalty}% nas vendas secundárias, pago automaticamente pelos
            marketplaces compatíveis.
          </dd>
          <dt className="text-canvas font-bold">Direitos autorais:</dt>
          <dd className="text-sandish">Contrato inteligente ERC-721 verificado.</dd>
        </dl>
      </section>

      {related.length > 0 ? (
        <section className="mt-12">
          <h2 className="text-primary border-primary border-b pb-4 text-[17px] leading-4 font-bold">
            Mais desta coleção
          </h2>
          <NftGrid items={related} variant="compact" className="mt-8" />
          <div className="mt-4 flex justify-center gap-2" aria-hidden>
            <span className="bg-primary size-3 rounded-full" />
            <span className="bg-primary/50 size-3 rounded-full" />
            <span className="bg-primary/50 size-3 rounded-full" />
          </div>
        </section>
      ) : null}
    </main>
  )
}

function StatsRow({
  views,
  bids,
  floorPrice,
  royalty
}: {
  views: number
  bids: number
  floorPrice: string
  royalty: number
}) {
  const cells = [
    { icon: EyeIcon, label: 'Visualizações', value: views.toLocaleString('pt-BR') },
    { icon: FlagIcon, label: 'Lances', value: bids.toLocaleString('pt-BR') },
    { icon: GemIcon, label: 'Preço mínimo', value: `${floorPrice} ETH` },
    { icon: GemIcon, label: 'Royalties', value: `${royalty}%` }
  ]
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cells.map((cell) => (
        <div key={cell.label} className="bg-surface-raised rounded-card p-3">
          <dt className="text-text-secondary flex items-center gap-1 text-xs">
            <cell.icon aria-hidden className="size-3.5" />
            {cell.label}
          </dt>
          <dd className="mt-1 text-sm font-semibold tabular-nums">{cell.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto max-w-[1248px] px-4 py-8 sm:px-6">{children}</main>
}

function DetailSkeleton() {
  return (
    <main className="mx-auto grid max-w-[1248px] gap-8 px-4 py-8 sm:px-6 lg:grid-cols-2">
      <Skeleton className="aspect-square w-full rounded-card" label="Carregando imagem" />
      <div className="space-y-4">
        <Skeleton className="h-8 w-2/3" label="Carregando título" />
        <Skeleton className="h-16 w-full" label="Carregando preço" />
        <Skeleton className="h-24 w-full" label="Carregando atributos" />
      </div>
    </main>
  )
}
