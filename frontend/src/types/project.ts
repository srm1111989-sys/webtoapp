export interface Project {
  id: string
  slug: string
  name: string
  description?: string
  color: string
  is_active: boolean
  member_count: number
  created_at: string
  updated_at: string
}

export interface ProjectCreate {
  slug: string
  name: string
  description?: string
  color?: string
}

export interface ProjectUpdate {
  name?: string
  description?: string
  color?: string
  is_active?: boolean
}

export interface ProjectMember {
  id: string
  project_id: string
  admin_id: string
  role: 'master_admin' | 'admin' | 'member'
  created_at: string
  admin_email?: string
  admin_name?: string
}

export interface ProjectMemberWithAdmin {
  id: string
  project_id: string
  admin_id: string
  role: string
  created_at: string
  admin_email: string
  admin_name: string
}

export interface ProjectStats {
  project_id: string
  member_count: number
  master_admin_count: number
  admin_count: number
  member_role_count: number
}

export interface MyProjectsResponse {
  projects: Project[]
  is_super: boolean
}

export const PROJECT_ROLES = ['master_admin', 'admin', 'member'] as const
export type ProjectRole = typeof PROJECT_ROLES[number]
