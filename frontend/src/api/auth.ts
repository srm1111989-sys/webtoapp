import client from './client'
import type { TokenResponse, User } from '@/types'

export const authApi = {
  register: (data: { email: string; password: string; full_name: string; phone?: string }) =>
    client.post<{ message: string }>('/api/auth/register', data),

  login: (data: { email: string; password: string }) =>
    client.post<TokenResponse>('/api/auth/login', data),

  refresh: (refresh_token: string) =>
    client.post<TokenResponse>('/api/auth/refresh', { refresh_token }),

  forgotPassword: (email: string) =>
    client.post<{ message: string }>('/api/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    client.post<{ message: string }>('/api/auth/reset-password', { token, password }),

  getMe: () =>
    client.get<User>('/api/auth/me'),
}
