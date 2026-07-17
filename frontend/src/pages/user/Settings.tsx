import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import { teamApi } from '@/api/team'
import { THEMES, applyTheme, getTheme } from '@/lib/theme'
import { Card, CardHeader, PageHeader, Button, Badge } from '@/components/ui'
import { Check, LogOut, Mail, User as UserIcon, Users, Trash2, Loader2 } from 'lucide-react'

export default function Settings() {
  const { user, logout } = useAuthStore()
  const [theme, setTheme] = useState(getTheme())
  const queryClient = useQueryClient()
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'viewer' | 'editor'>('viewer')

  const pick = (id: string) => {
    applyTheme(id)
    setTheme(id)
  }

  const { data: team } = useQuery({
    queryKey: ['team'],
    queryFn: () => teamApi.get().then((r) => r.data),
  })

  const addMember = useMutation({
    mutationFn: () => teamApi.add(inviteEmail.trim(), inviteRole),
    onSuccess: () => {
      setInviteEmail('')
      queryClient.invalidateQueries({ queryKey: ['team'] })
      toast.success('Team member added — ask them to sign up or log in with that email.')
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.detail || 'Could not add team member.'),
  })

  const changeRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: 'viewer' | 'editor' }) =>
      teamApi.updateRole(id, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['team'] }),
    onError: () => toast.error('Could not update role.'),
  })

  const removeMember = useMutation({
    mutationFn: (id: string) => teamApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] })
      toast.success('Team member removed')
    },
    onError: () => toast.error('Could not remove team member.'),
  })

  return (
    <div className="max-w-3xl space-y-6 animate-fade-up">
      <PageHeader title="Settings" subtitle="Your profile and workspace preferences" />

      <Card>
        <CardHeader title="Profile" />
        <div className="px-5 pb-5 space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <span className="p-2 rounded-lg bg-gray-100 text-soft"><UserIcon className="w-4 h-4" /></span>
            <div>
              <p className="text-xs text-soft">Name</p>
              <p className="font-medium text-ink">{user?.full_name || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="p-2 rounded-lg bg-gray-100 text-soft"><Mail className="w-4 h-4" /></span>
            <div>
              <p className="text-xs text-soft">Email</p>
              <p className="font-medium text-ink">{user?.email || '—'}</p>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Theme" subtitle="Pick how your dashboard looks — applies instantly, saved on this device" />
        <div className="px-5 pb-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => pick(t.id)}
              aria-pressed={theme === t.id}
              className={`relative rounded-xl border-2 p-3 text-left transition-all hover:shadow-sm ${
                theme === t.id ? 'border-primary-500 ring-2 ring-primary-200' : 'border-line hover:border-gray-300'
              }`}
            >
              <span className="flex gap-1.5 mb-2">
                {t.swatch.map((c, i) => (
                  <span key={i} className="w-6 h-6 rounded-md border border-black/10" style={{ background: c }} />
                ))}
              </span>
              <span className="block text-xs font-semibold text-ink">{t.label}</span>
              {theme === t.id && (
                <span className="absolute top-2 right-2 p-0.5 rounded-full bg-primary-600 text-white">
                  <Check className="w-3 h-3" />
                </span>
              )}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader
          title={<span className="inline-flex items-center gap-2"><Users className="w-4 h-4 text-soft" /> Team</span>}
          subtitle="Share your apps and orders with teammates. Editors can edit apps and trigger rebuilds; viewers are read-only. Payments always stay with you."
        />
        <div className="px-5 pb-5 space-y-4">
          {/* Invite form */}
          <form
            className="flex flex-col sm:flex-row gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              if (inviteEmail.trim()) addMember.mutate()
            }}
          >
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="teammate@company.com"
              className="flex-1 px-3 py-2 text-sm bg-surface border border-line rounded-lg text-ink placeholder:text-soft focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as 'viewer' | 'editor')}
              className="px-3 py-2 text-sm bg-surface border border-line rounded-lg text-ink focus:outline-none focus:ring-2 focus:ring-primary-200"
            >
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
            </select>
            <Button type="submit" disabled={addMember.isPending || !inviteEmail.trim()}>
              {addMember.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add member'}
            </Button>
          </form>
          <p className="text-xs text-soft">
            No email is sent — just tell them to sign up (or log in) at websitetoapp.app with this
            address and your apps will appear in their dashboard.
          </p>

          {/* Members list */}
          {(team?.members?.length ?? 0) > 0 && (
            <ul className="divide-y divide-line border border-line rounded-xl">
              {team!.members.map((m) => (
                <li key={m.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="flex-1 min-w-0 text-sm text-ink truncate">{m.email}</span>
                  <Badge tone={m.registered ? 'green' : 'amber'}>
                    {m.registered ? 'active' : 'not signed up yet'}
                  </Badge>
                  <select
                    value={m.role}
                    onChange={(e) => changeRole.mutate({ id: m.id, role: e.target.value as 'viewer' | 'editor' })}
                    className="px-2 py-1 text-xs bg-surface border border-line rounded-md text-ink"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                  </select>
                  <button
                    onClick={() => {
                      if (window.confirm(`Remove ${m.email} from your team?`)) removeMember.mutate(m.id)
                    }}
                    className="p-1.5 rounded-md text-soft hover:text-red-600 hover:bg-red-50 transition"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Workspaces shared with me */}
          {(team?.memberships?.length ?? 0) > 0 && (
            <div>
              <p className="text-xs font-semibold text-soft uppercase tracking-wide mb-2">Shared with you</p>
              <ul className="space-y-1.5">
                {team!.memberships.map((ms, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-ink">
                    <Users className="w-3.5 h-3.5 text-soft" />
                    {ms.owner_email}
                    <Badge tone="blue">{ms.role}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title="Session" />
        <div className="px-5 pb-5">
          <Button variant="secondary" onClick={() => { logout(); window.location.href = '/login' }}>
            <LogOut className="w-4 h-4" /> Log out
          </Button>
        </div>
      </Card>
    </div>
  )
}
