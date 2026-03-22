import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { RoleName } from '@/types/api'

export interface AuthUser {
  id: string
  email: string
  fullName: string
  role: RoleName
  municipalityId: string
}

interface AuthState {
  token: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  login: (token: string, user: AuthUser) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      login: (token, user) =>
        set({ token, user, isAuthenticated: true }),
      logout: () =>
        set({ token: null, user: null, isAuthenticated: false }),
    }),
    {
      name: 'municipal-os-auth',
    },
  ),
)
