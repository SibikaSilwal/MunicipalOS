import { createFileRoute, redirect } from '@tanstack/react-router'
import { getRoleDashboard } from '@/lib/auth'

export const Route = createFileRoute('/')({
  beforeLoad: ({ context }) => {
    if (context.auth.isAuthenticated && context.auth.user) {
      throw redirect({ to: getRoleDashboard(context.auth.user.role) })
    }
    throw redirect({ to: '/login' })
  },
})
