import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Save, Loader2, CreditCard, GitBranch, Mail, Eye, EyeOff, FlaskConical, AlertTriangle, CheckCircle2, LogIn } from 'lucide-react'
import { adminApi } from '@/api/admin'

interface SettingsSection {
  title: string
  icon: React.ElementType
  fields: { key: string; label: string; type: 'text' | 'password'; placeholder: string }[]
}

const SECTIONS: SettingsSection[] = [
  {
    title: 'Razorpay — Live Keys',
    icon: CreditCard,
    fields: [
      { key: 'razorpay_key_id', label: 'Live Key ID', type: 'text', placeholder: 'rzp_live_xxxxxxxxxxxx' },
      { key: 'razorpay_key_secret', label: 'Live Key Secret', type: 'password', placeholder: 'Enter Razorpay live secret' },
    ],
  },
  {
    title: 'Razorpay — Test Keys',
    icon: FlaskConical,
    fields: [
      { key: 'razorpay_test_key_id', label: 'Test Key ID', type: 'text', placeholder: 'rzp_test_xxxxxxxxxxxx' },
      { key: 'razorpay_test_key_secret', label: 'Test Key Secret', type: 'password', placeholder: 'Enter Razorpay test secret' },
    ],
  },
  {
    title: 'Stripe — Live Keys',
    icon: CreditCard,
    fields: [
      { key: 'stripe_publishable_key', label: 'Live Publishable Key', type: 'text', placeholder: 'pk_live_xxxxxxxxxxxx' },
      { key: 'stripe_secret_key', label: 'Live Secret Key', type: 'password', placeholder: 'sk_live_xxxxxxxxxxxx' },
    ],
  },
  {
    title: 'Stripe — Test Keys',
    icon: FlaskConical,
    fields: [
      { key: 'stripe_test_publishable_key', label: 'Test Publishable Key', type: 'text', placeholder: 'pk_test_xxxxxxxxxxxx' },
      { key: 'stripe_test_secret_key', label: 'Test Secret Key', type: 'password', placeholder: 'sk_test_xxxxxxxxxxxx' },
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
  {
    title: 'Google OAuth',
    icon: LogIn,
    fields: [
      { key: 'google_client_id', label: 'Client ID', type: 'text', placeholder: 'xxxxxxxxxxxx.apps.googleusercontent.com' },
    ],
  },
]

export default function AdminSettings() {
  const queryClient = useQueryClient()
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
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] })
      queryClient.invalidateQueries({ queryKey: ['payment-mode'] })
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

  const testModeEnabled = formData['payment_test_mode']?.toLowerCase() === 'true'

  const toggleTestMode = () => {
    const newValue = testModeEnabled ? 'false' : 'true'
    setFormData((prev) => ({ ...prev, payment_test_mode: newValue }))
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

      {/* Payment Test Mode Card */}
      <div className={`rounded-xl border-2 shadow-sm overflow-hidden ${testModeEnabled ? 'border-amber-400 bg-amber-50' : 'border-gray-200 bg-white'}`}>
        <div className="flex items-center gap-3 px-6 py-4 border-b bg-gray-50">
          <FlaskConical className="w-5 h-5 text-gray-600" />
          <h2 className="font-semibold text-gray-900">Payment Gateway Mode</h2>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-lg ${testModeEnabled ? 'bg-amber-100 text-amber-600' : 'bg-green-50 text-green-600'}`}>
                {testModeEnabled ? (
                  <FlaskConical className="w-6 h-6" />
                ) : (
                  <CheckCircle2 className="w-6 h-6" />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {testModeEnabled ? 'Test Mode Active' : 'Live Mode Active'}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {testModeEnabled
                    ? 'Payments use test gateway credentials. No real charges. Use Razorpay/Stripe test cards to complete checkout.'
                    : 'Payments are processed through live gateway credentials (Razorpay / Stripe).'}
                </p>
                {testModeEnabled && (
                  <div className="flex items-center gap-1.5 mt-2 text-amber-700 text-xs font-medium">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Do not use test mode in production with real users
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={toggleTestMode}
              className={`relative w-14 h-7 rounded-full transition-colors flex items-center shrink-0 ml-4 ${
                testModeEnabled ? 'bg-amber-500' : 'bg-gray-300'
              }`}
            >
              <div className={`w-6 h-6 bg-white rounded-full shadow transition-transform ${testModeEnabled ? 'translate-x-7' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {/* Gateway status indicators */}
          <div className="mt-5 pt-5 border-t grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white border">
              <CreditCard className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Razorpay</p>
                <p className="text-xs text-gray-500">
                  {testModeEnabled ? (
                    formData['razorpay_test_key_id'] ? (
                      <span className="text-amber-600">Using test keys</span>
                    ) : (
                      <span className="text-red-500">Test keys not configured</span>
                    )
                  ) : (
                    formData['razorpay_key_id'] ? (
                      <span className="text-green-600">Using live keys</span>
                    ) : (
                      <span className="text-gray-400">Not configured</span>
                    )
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white border">
              <CreditCard className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Stripe</p>
                <p className="text-xs text-gray-500">
                  {testModeEnabled ? (
                    formData['stripe_test_secret_key'] ? (
                      <span className="text-amber-600">Using test keys</span>
                    ) : (
                      <span className="text-red-500">Test keys not configured</span>
                    )
                  ) : (
                    formData['stripe_secret_key'] ? (
                      <span className="text-green-600">Using live keys</span>
                    ) : (
                      <span className="text-gray-400">Not configured</span>
                    )
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
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
