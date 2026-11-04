import { createFileRoute } from '@tanstack/react-router'
import { ItemDetailScreen } from '@/features/detail/item-detail-screen'
import { useAuthDialog } from '@/features/auth/auth-dialog'

export const Route = createFileRoute('/nfts/$nftId')({
  component: NftDetailRoute
})

function NftDetailRoute() {
  const { nftId } = Route.useParams()
  const { openAuth } = useAuthDialog()
  return <ItemDetailScreen nftId={nftId} onRequireAuth={() => openAuth('login')} />
}
