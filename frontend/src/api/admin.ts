import client from './client'
import type { TokenResponse, User, Order, Build, Plan, AdminStats, AdminEnhancedStats, BuildLog } from '@/types'

const adminClient = client

export const adminApi = {
  login: (data: { email: string; password: string }) =>
    adminClient.post<TokenResponse>('/api/admin/login', data),

  getStats: () =>
    adminClient.get<AdminStats>('/api/admin/stats'),

  // Users
  listUsers: (page = 1, per_page = 20, search?: string) => {
    let url = `/api/admin/users?page=${page}&per_page=${per_page}`
    if (search) url += `&search=${encodeURIComponent(search)}`
    return adminClient.get<{ users: User[]; total: number; page: number; per_page: number }>(url)
  },

  updateUserStatus: (userId: string, is_active: boolean) =>
    adminClient.put<{ message: string }>(`/api/admin/users/${userId}/status?is_active=${is_active}`),

  getUserTestMode: (userId: string) =>
    adminClient.get<{ user_id: string; test_mode: boolean }>(`/api/admin/users/${userId}/test-mode`),

  toggleUserTestMode: (userId: string, enable: boolean) =>
    adminClient.put<{ message: string }>(`/api/admin/users/${userId}/test-mode?enable=${enable}`),

  // Orders
  listOrders: (page = 1, per_page = 20, status?: string) => {
    let url = `/api/admin/orders?page=${page}&per_page=${per_page}`
    if (status) url += `&status_filter=${status}`
    return adminClient.get<{ orders: Order[]; total: number; page: number; per_page: number }>(url)
  },

  forceRebuild: (orderId: string) =>
    adminClient.post<Build>(`/api/admin/orders/${orderId}/rebuild`),

  // Builds
  listBuilds: (page = 1, per_page = 20, status?: string) => {
    let url = `/api/admin/builds?page=${page}&per_page=${per_page}`
    if (status) url += `&status_filter=${status}`
    return adminClient.get<Build[]>(url)
  },

  // Plans
  listPlans: () =>
    adminClient.get<Plan[]>('/api/admin/plans'),

  createPlan: (data: Partial<Plan>) =>
    adminClient.post<Plan>('/api/admin/plans', data),

  updatePlan: (id: string, data: Partial<Plan>) =>
    adminClient.put<Plan>(`/api/admin/plans/${id}`, data),

  // Settings
  getSettings: () =>
    adminClient.get<Record<string, string>>('/api/admin/settings'),

  updateSettings: (data: Record<string, string>) =>
    adminClient.put<{ message: string }>('/api/admin/settings', data),

  // Payments
  listPayments: (page = 1, per_page = 20) =>
    adminClient.get(`/api/admin/payments?page=${page}&per_page=${per_page}`),

  // Enhanced stats
  getEnhancedStats: () =>
    adminClient.get<AdminEnhancedStats>('/api/admin/stats/enhanced'),

  // Build logs
  getBuildLog: (buildId: string) =>
    adminClient.get<BuildLog>(`/api/admin/builds/${buildId}/log`),
}
