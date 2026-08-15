import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, Users, ChevronRight, ChevronLeft, X, Loader2, FolderOpen, Shield } from 'lucide-react'
import { Link } from 'react-router-dom'
import { projectsApi } from '@/api/projects'
import type { Project, ProjectCreate, ProjectUpdate, ProjectMemberWithAdmin } from '@/types/project'
import { PROJECT_ROLES } from '@/types/project'

const PROJECT_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

const ROLE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  master_admin: { label: 'Master Admin', color: 'text-amber-700', bg: 'bg-amber-100' },
  admin: { label: 'Admin', color: 'text-blue-700', bg: 'bg-blue-100' },
  member: { label: 'Member', color: 'text-gray-700', bg: 'bg-gray-100' },
}

function ProjectModal({
  project,
  onClose,
}: {
  project?: Project
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [slug, setSlug] = useState(project?.slug || '')
  const [name, setName] = useState(project?.name || '')
  const [description, setDescription] = useState(project?.description || '')
  const [color, setColor] = useState(project?.color || '#6366f1')

  const mutation = useMutation({
    mutationFn: (data: ProjectCreate | ProjectUpdate) =>
      project
        ? projectsApi.update(project.id, data as ProjectUpdate)
        : projectsApi.create(data as ProjectCreate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'projects'] })
      toast.success(project ? 'Project updated' : 'Project created')
      onClose()
    },
    onError: () => toast.error('Failed to save project'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate({ slug, name, description, color })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-semibold">{project ? 'Edit Project' : 'New Project'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              disabled={!!project}
              className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-100"
              placeholder="e.g. ownstore"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
            <div className="flex gap-2 flex-wrap">
              {PROJECT_COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={mutation.isPending} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {mutation.isPending ? 'Saving...' : project ? 'Update' : 'Create'}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function MembersPanel({ project }: { project: Project }) {
  const queryClient = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)
  const [allAdmins, setAllAdmins] = useState<{ id: string; email: string; full_name: string }[]>([])
  const [selectedAdmin, setSelectedAdmin] = useState('')
  const [selectedRole, setSelectedRole] = useState('member')

  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ['admin', 'project-members', project.id],
    queryFn: () => projectsApi.listMembers(project.id).then((r) => r.data),
  })

  useEffect(() => {
    if (showAdd) {
      projectsApi.listAvailableAdmins(project.id).then((r) => setAllAdmins(r.data))
    }
  }, [showAdd, project.id])

  const addMutation = useMutation({
    mutationFn: ({ adminId, role }: { adminId: string; role: string }) =>
      projectsApi.addMember(project.id, { admin_id: adminId, role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'project-members', project.id] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'projects'] })
      toast.success('Member added')
      setShowAdd(false)
      setSelectedAdmin('')
      setSelectedRole('member')
    },
    onError: () => toast.error('Failed to add member'),
  })

  const roleMutation = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: string }) =>
      projectsApi.updateMemberRole(project.id, memberId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'project-members', project.id] })
      toast.success('Role updated')
    },
    onError: () => toast.error('Failed to update role'),
  })

  const removeMutation = useMutation({
    mutationFn: (memberId: string) => projectsApi.removeMember(project.id, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'project-members', project.id] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'projects'] })
      toast.success('Member removed')
    },
    onError: () => toast.error('Failed to remove member'),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
          <Users className="w-4 h-4" /> Members
        </h4>
        <button onClick={() => setShowAdd(true)} className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 flex items-center gap-1">
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>

      {membersLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : members && members.length > 0 ? (
        <div className="divide-y border rounded-lg overflow-hidden">
          {members.map((m) => {
            const roleInfo = ROLE_LABELS[m.role] || ROLE_LABELS.member
            return (
              <div key={m.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
                    {m.admin_name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{m.admin_name}</p>
                    <p className="text-xs text-gray-500">{m.admin_email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={m.role}
                    onChange={(e) => roleMutation.mutate({ memberId: m.id, role: e.target.value })}
                    className="text-xs border rounded-lg px-2 py-1 bg-white"
                  >
                    {PROJECT_ROLES.map((r) => (
                      <option key={r} value={r}>{ROLE_LABELS[r]?.label || r}</option>
                    ))}
                  </select>
                  <button onClick={() => { if (confirm('Remove this member?')) removeMutation.mutate(m.id) }}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-sm text-gray-400 text-center py-6">No members yet.</p>
      )}

      {/* Add member modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5">
            <h4 className="font-semibold mb-4">Add Member</h4>
            <div className="space-y-3">
              <select value={selectedAdmin} onChange={(e) => setSelectedAdmin(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="">Select admin...</option>
                {allAdmins
                  .filter((a) => !members?.some((m) => m.admin_id === a.id))
                  .map((a) => (
                    <option key={a.id} value={a.id}>{a.full_name} ({a.email})</option>
                  ))}
              </select>
              <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                {PROJECT_ROLES.map((r) => (
                  <option key={r} value={r}>{ROLE_LABELS[r]?.label || r}</option>
                ))}
              </select>
              <div className="flex gap-2 pt-1">
                <button onClick={() => { if (selectedAdmin) addMutation.mutate({ adminId: selectedAdmin, role: selectedRole }) }}
                  disabled={!selectedAdmin || addMutation.isPending}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  {addMutation.isPending ? 'Adding...' : 'Add Member'}
                </button>
                <button onClick={() => setShowAdd(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminProjects() {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  const { data: projectsData, isLoading } = useQuery({
    queryKey: ['admin', 'projects'],
    queryFn: () => projectsApi.list().then((r) => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => projectsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'projects'] })
      toast.success('Project deleted')
    },
    onError: () => toast.error('Failed to delete project'),
  })

  const projects = projectsData?.items || []

  // If a project is selected, show its detail panel
  if (selectedProject) {
    return (
      <div className="space-y-6">
        <div>
          <button onClick={() => setSelectedProject(null)} className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 mb-2">
            <ChevronLeft className="w-4 h-4" /> Back to projects
          </button>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: selectedProject.color }} />
            <h1 className="text-2xl font-bold text-gray-900">{selectedProject.name}</h1>
            <span className="text-sm text-gray-500 font-mono">{selectedProject.slug}</span>
          </div>
          {selectedProject.description && <p className="text-gray-500 mt-1">{selectedProject.description}</p>}
        </div>
        <MembersPanel project={selectedProject} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-500 mt-1">Manage projects and member access</p>
        </div>
        <button onClick={() => { setEditingProject(null); setShowModal(true) }}
          className="bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : projects.length === 0 ? (
          <div className="col-span-full text-center py-16 text-gray-400">
            <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            No projects yet. Create one to get started.
          </div>
        ) : (
          projects.map((project) => (
            <div key={project.id} className="bg-white rounded-xl border p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
                  <div>
                    <h3 className="font-semibold text-gray-900">{project.name}</h3>
                    <p className="text-xs text-gray-500 font-mono">{project.slug}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditingProject(project); setShowModal(true) }}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => { if (confirm('Delete this project?')) deleteMutation.mutate(project.id) }}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {project.description && <p className="text-sm text-gray-500 mt-2 line-clamp-2">{project.description}</p>}
              <div className="flex items-center justify-between mt-4 pt-3 border-t">
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{project.member_count || 0} members</span>
                </div>
                <button onClick={() => setSelectedProject(project)}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-0.5">
                  Manage <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <ProjectModal
          project={editingProject}
          onClose={() => { setShowModal(false); setEditingProject(null) }}
        />
      )}
    </div>
  )
}
