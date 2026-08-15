import client from './client'
import type { Project, ProjectCreate, ProjectUpdate, ProjectMemberWithAdmin, MyProjectsResponse } from '@/types/project'

export const projectsApi = {
  list: (page = 1, per_page = 20) =>
    client.get<{ items: Project[]; total: number }>(
      `/api/admin/projects?page=${page}&per_page=${per_page}`
    ),

  get: (id: string) =>
    client.get<Project>(`/api/admin/projects/${id}`),

  create: (data: ProjectCreate) =>
    client.post<Project>('/api/admin/projects', data),

  update: (id: string, data: ProjectUpdate) =>
    client.put<Project>(`/api/admin/projects/${id}`, data),

  remove: (id: string) =>
    client.delete(`/api/admin/projects/${id}`),

  myProjects: () =>
    client.get<MyProjectsResponse>('/api/admin/projects/me/assigned'),

  listMembers: (projectId: string) =>
    client.get<ProjectMemberWithAdmin[]>(`/api/admin/projects/${projectId}/members`),

  addMember: (projectId: string, data: { admin_id: string; role: string }) =>
    client.post<{ id: string; project_id: string; admin_id: string; role: string; created_at: string }>(
      `/api/admin/projects/${projectId}/members`, data
    ),

  updateMemberRole: (projectId: string, memberId: string, role: string) =>
    client.put<{ id: string; project_id: string; admin_id: string; role: string; created_at: string }>(
      `/api/admin/projects/${projectId}/members/${memberId}`, { role }
    ),

  removeMember: (projectId: string, memberId: string) =>
    client.delete(`/api/admin/projects/${projectId}/members/${memberId}`),

  listAvailableAdmins: (projectId: string) =>
    client.get<{ id: string; email: string; full_name: string }[]>(
      `/api/admin/projects/available-admins?project_id=${projectId}`
    ),
}
