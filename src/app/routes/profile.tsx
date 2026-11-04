import { createFileRoute } from '@tanstack/react-router'
import { requireSession } from '@/app/auth-guard'
import { ProfileScreen } from '@/features/account/profile-screen'

export const Route = createFileRoute('/profile')({
  beforeLoad: ({ context }) => requireSession(context.queryClient, '/profile'),
  component: () => <ProfileScreen />
})
