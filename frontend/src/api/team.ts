import client from './client'
import type { TeamMember, TeamResponse } from '@/types'

export const teamApi = {
  get: () => client.get<TeamResponse>('/api/team'),

  add: (email: string, role: 'viewer' | 'editor') =>
    client.post<TeamMember>('/api/team', { email, role }),

  updateRole: (id: string, role: 'viewer' | 'editor') =>
    client.put<TeamMember>(`/api/team/${id}`, { role }),

  remove: (id: string) => client.delete(`/api/team/${id}`),
}
