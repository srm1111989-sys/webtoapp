import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/api/auth'

export function useAuth() {
  const { user, accessToken, setUser, logout } = useAuthStore()

  const { data, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => authApi.getMe().then((r) => r.data),
    enabled: !!accessToken && !user,
    retry: false,
  })

  useEffect(() => {
    if (data) setUser(data)
  }, [data, setUser])

  return {
    user: user || data || null,
    isLoading: isLoading && !!accessToken,
    isAuthenticated: !!accessToken,
    logout,
  }
}
