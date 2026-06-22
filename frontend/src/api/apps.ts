import client from './client'
import type { AppConfig } from '@/types'

export const appsApi = {
  create: (data: Partial<AppConfig>) =>
    client.post<AppConfig>('/api/apps/', data),

  list: () =>
    client.get<{ apps: AppConfig[]; total: number }>('/api/apps/'),

  get: (id: string) =>
    client.get<AppConfig>(`/api/apps/${id}`),

  update: (id: string, data: Partial<AppConfig>) =>
    client.put<AppConfig>(`/api/apps/${id}`, data),

  delete: (id: string) =>
    client.delete(`/api/apps/${id}`),

  uploadIcon: (id: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return client.post<AppConfig>(`/api/apps/${id}/icon`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  uploadSplash: (id: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return client.post<AppConfig>(`/api/apps/${id}/splash`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  uploadKeystore: (id: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return client.post<AppConfig>(`/api/apps/${id}/keystore`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
