import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { THEMES, applyTheme, getTheme } from '@/lib/theme'
import { Card, CardHeader, PageHeader, Button } from '@/components/ui'
import { Check, LogOut, Mail, User as UserIcon } from 'lucide-react'

export default function Settings() {
  const { user, logout } = useAuthStore()
  const [theme, setTheme] = useState(getTheme())

  const pick = (id: string) => {
    applyTheme(id)
    setTheme(id)
  }

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
