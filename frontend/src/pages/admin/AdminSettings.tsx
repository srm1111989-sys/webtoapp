import { useEffect, useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Save, Loader2, CreditCard, GitBranch, Mail, Eye, EyeOff } from 'lucide-react'
import { adminApi } from '@/api/admin'

interface SettingsSection {
  title: string
  icon: React.ElementType
  fields: { key: string; label: string; type: 'text' | 'password'; placeholder: string }[]
}

const SECTIONS: SettingsSection[] = [
  {
    title: 'Razorpay',
    icon: CreditCard,
    fields: [
      { key: 'razorpay_key_id', label: 'Key ID', type: 'text', placeholder: 'rzp_live_xxxxxxxxxxxx' },
      { key: 'razorpay_key_secret', label: 'Key Secret', type: 'password', placeholder: 'Enter Razorpay secret' },
    ],
  },
  {
    title: 'Stripe',
    icon: CreditCard,
    fields: [
      { key: 'stripe_publishable_key', label: 'Publishable Key', type: 'text', placeholder: 'pk_live_xxxxxxxxxxxx' },
      { key: 'stripe_secret_key', label: 'Secret Key', type: 'password', placeholder: 'sk_live_xxxxxxxxxxxx' },
    ],
  },
  {
    title: 'GitLab',
    icon: GitBranch,
    fields: [
      { key: 'gitlab_url', label: 'GitLab URL', type: 'text', placeholder: 'https://gitlab.com' },
      { key: 'gitlab_token', label: 'Private Token', type: 'password', placeholder: 'Enter GitLab token' },
      { key: 'gitlab_project_id', label: 'Project ID', type: 'text', placeholder: '12345' },
    ],
  },
  {
    title: 'SMTP',
    icon: Mail,
    fields: [
      { key: 'smtp_host', label: 'Host', type: 'text', placeholder: 'smtp.gmail.com' },
      { key: 'smtp_port', label: 'Port', type: 'text', placeholder: '587' },
      { key: 'smtp_user', label: 'Username', type: 'text', placeholder: 'user@example.com' },
      { key: 'smtp_password', label: 'Password', type: 'password', placeholder: 'Enter SMTP password' },
    ],
  },
]

export default function AdminSettings() {
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({})

  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => adminApi.getSettings().then((r) => r.data),
  })

  useEffect(() => {
    if (settings) {
      setFormData(settings)
    }
  }, [settings])

  const saveMutation = useMutation({
    mutationFn: (data: Record<string, string>) => adminApi.updateSettings(data),
    onSuccess: () => {
      toast.success('Settings saved successfully')
    },
    onError: () => {
      toast.error('Failed to save settings')
    },
  })

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const togglePasswordVisibility = (key: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = () => {
    saveMutation.mutate(formData)
  }

  const inputClass = 'w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 mt-1">Configure platform integrations and credentials</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saveMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Settings
        </button>
      </div>

      {SECTIONS.map((section) => {
        const SectionIcon = section.icon
        return (
          <div key={section.title} className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b bg-gray-50">
              <SectionIcon className="w-5 h-5 text-gray-600" />
              <h2 className="font-semibold text-gray-900">{section.title}</h2>
            </div>
            <div className="p-6 space-y-4">
              {section.fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                  <div className="relative">
                    <input
                      type={field.type === 'password' && !visiblePasswords[field.key] ? 'password' : 'text'}
                      className={inputClass}
                      value={formData[field.key] || ''}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                    />
                    {field.type === 'password' && (
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility(field.key)}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                      >
                        {visiblePasswords[field.key] ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
