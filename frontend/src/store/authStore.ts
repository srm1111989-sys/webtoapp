import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAdmin: boolean
  setUser: (user: User) => void
  setTokens: (access: string, refresh: string) => void
  setAdmin: (isAdmin: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAdmin: false,
      setUser: (user) => set({ user }),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      setAdmin: (isAdmin) => set({ isAdmin }),
      logout: () => set({ user: null, accessToken: null, refreshToken: null, isAdmin: false }),
    }),
    {
      name: 'webtoapp-auth',
    },
  ),
)
