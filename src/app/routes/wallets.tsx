import { createFileRoute } from '@tanstack/react-router'
import { requireSession } from '@/app/auth-guard'
import { WalletsScreen } from '@/features/wallet/wallets-screen'

export const Route = createFileRoute('/wallets')({
  beforeLoad: ({ context }) => requireSession(context.queryClient, '/wallets'),
  component: () => <WalletsScreen />
})
