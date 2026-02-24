import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Pencil, X, Loader2 } from 'lucide-react'
import { adminApi } from '@/api/admin'
import { formatCurrency } from '@/utils/format'
import type { Plan } from '@/types'

interface PlanFormData {
  name: string
  slug: string
  description: string
  price_inr: number
  price_usd: number
  billing_type: 'one_time'
  max_apps: number
  platform: 'android' | 'desktop'
  is_active: boolean
  sort_order: number
  features: Record<string, boolean>
}

const EMPTY_FORM: PlanFormData = {
  name: '',
  slug: '',
  description: '',
  price_inr: 0,
  price_usd: 0,
  billing_type: 'one_time',
  max_apps: 1,
  platform: 'android',
  is_active: true,
  sort_order: 0,
  features: {},
}

const FEATURE_KEYS = [
  'twa', 'webview_fallback', 'custom_icon', 'custom_splash', 'custom_colors',
  'fullscreen', 'orientation_lock',
  'push_notifications', 'admob', 'biometric_auth', 'deep_linking', 'offline_mode',
  'navigation_menu', 'firebase', 'qr_scanner', 'js_bridge', 'screenshot_prevention',
  'file_upload', 'location_services', 'camera_access', 'onboarding_screen',
  'app_shortcut', 'secondary_navigation', 'social_login', 'in_app_update',
  'background_location', 'facebook_app_events', 'in_app_purchases', 'in_app_review',
  'background_service', 'native_contacts', 'appsflyer', 'custom_media_player',
  'offer_card', 'intercom', 'dynamic_app_icon', 'bluetooth_connectivity',
  'download_file_manager', 'floating_action_menu', 'revenue_cat', 'native_datastore',
  'passcode_lock', 'app_auto_launch', 'advanced_bottom_navigation',
  'firebase_notification', 'tap_to_pay',
  'aab_output', 'pwa', 'priority_support',
  'watermark', 'system_tray', 'custom_window_size', 'auto_updater',
  'native_notifications', 'kiosk_mode', 'custom_title_bar', 'multi_window',
  'tray_menu', 'startup_launch',
]

export default function AdminPlans() {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [form, setForm] = useState<PlanFormData>(EMPTY_FORM)

  const { data: plans, isLoading, error } = useQuery({
    queryKey: ['admin', 'plans'],
    queryFn: () => adminApi.listPlans().then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: Partial<Plan>) => adminApi.createPlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'plans'] })
      toast.success('Plan created')
      closeModal()
    },
    onError: () => {
      toast.error('Failed to create plan')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Plan> }) => adminApi.updatePlan(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'plans'] })
      toast.success('Plan updated')
      closeModal()
    },
    onError: () => {
      toast.error('Failed to update plan')
    },
  })

  const openCreate = () => {
    setEditingPlan(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  const openEdit = (plan: Plan) => {
    setEditingPlan(plan)
    setForm({
      name: plan.name,
      slug: plan.slug,
      description: plan.description || '',
      price_inr: plan.price_inr,
      price_usd: plan.price_usd,
      billing_type: 'one_time',
      max_apps: plan.max_apps,
      platform: plan.platform || 'android',
      is_active: plan.is_active,
      sort_order: plan.sort_order,
      features: { ...plan.features },
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingPlan(null)
    setForm(EMPTY_FORM)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload: Partial<Plan> = {
      name: form.name,
      slug: form.slug,
      description: form.description || undefined,
      price_inr: form.price_inr,
      price_usd: form.price_usd,
      billing_type: form.billing_type,
      max_apps: form.max_apps,
      platform: form.platform,
      is_active: form.is_active,
      sort_order: form.sort_order,
      features: form.features,
    }

    if (editingPlan) {
      updateMutation.mutate({ id: editingPlan.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const toggleFeature = (key: string) => {
    setForm((prev) => ({
      ...prev,
      features: { ...prev.features, [key]: !prev.features[key] },
    }))
  }

  const isSaving = createMutation.isPending || updateMutation.isPending
  const inputClass = 'w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plans</h1>
          <p className="text-gray-500 mt-1">Manage pricing plans</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Create Plan
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin text-gray-400" />
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-red-500">Failed to load plans.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Name</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Slug</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Price INR</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Price USD</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Platform</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Max Apps</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Active</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(plans as Plan[])?.map((plan) => (
                  <tr key={plan.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">{plan.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono text-gray-600">{plan.slug}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">{formatCurrency(plan.price_inr, 'INR')}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">{formatCurrency(plan.price_usd, 'USD')}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 capitalize">{plan.platform || 'android'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{plan.max_apps}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          plan.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {plan.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openEdit(plan)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
                {(plans as Plan[])?.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-gray-400">
                      No plans found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingPlan ? 'Edit Plan' : 'Create Plan'}
              </h2>
              <button onClick={closeModal} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    className={inputClass}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                  <input
                    className={inputClass}
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  className={inputClass}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price INR (paise)</label>
                  <input
                    type="number"
                    className={inputClass}
                    value={form.price_inr}
                    onChange={(e) => setForm({ ...form, price_inr: Number(e.target.value) })}
                    min={0}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price USD (cents)</label>
                  <input
                    type="number"
                    className={inputClass}
                    value={form.price_usd}
                    onChange={(e) => setForm({ ...form, price_usd: Number(e.target.value) })}
                    min={0}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
                  <select
                    className={inputClass}
                    value={form.platform}
                    onChange={(e) => setForm({ ...form, platform: e.target.value as 'android' | 'desktop' })}
                  >
                    <option value="android">Android</option>
                    <option value="desktop">Desktop</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Apps</label>
                  <input
                    type="number"
                    className={inputClass}
                    value={form.max_apps}
                    onChange={(e) => setForm({ ...form, max_apps: Number(e.target.value) })}
                    min={1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                  <input
                    type="number"
                    className={inputClass}
                    value={form.sort_order}
                    onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                    min={0}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-300 peer-checked:bg-blue-600 rounded-full transition-colors after:content-[''] after:absolute after:top-0.5 after:left-[2px] peer-checked:after:translate-x-full after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-transform" />
                </label>
                <span className="text-sm text-gray-700">Active</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Features</label>
                <div className="grid grid-cols-2 gap-2">
                  {FEATURE_KEYS.map((key) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.features[key] ?? false}
                        onChange={() => toggleFeature(key)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        {key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : editingPlan ? (
                    'Update Plan'
                  ) : (
                    'Create Plan'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
