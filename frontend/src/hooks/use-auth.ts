import { useAuthStore } from '@/stores/auth-store'

export function useAuth() {
  const { token, user, isAuthenticated, logout } = useAuthStore()
  return { token, user, isAuthenticated, logout }
}
