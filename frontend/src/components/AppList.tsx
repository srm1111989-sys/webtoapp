import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { appsApi } from '@/api/apps'
import { ordersApi, plansApi } from '@/api/orders'
import { getUserCurrency } from '@/utils/format'
import type { Order, Plan } from '@/types'
import { AppWindow, Plus, Globe, Loader2, AlertCircle, Smartphone, Monitor, ArrowRight, AlertTriangle, Pencil, Hammer, Clock, Zap, Trash2 } from 'lucide-react'

// One chip + one primary action per app state (2026-07-17 flow).
function stateChip(order?: Order) {
  if (!order) return { label: 'Not built', cls: 'bg-gray-50 text-gray-500 border-gray-200' }
  switch (order.plan_state) {
    case 'paid':
      return { label: 'PAID', cls: 'bg-green-50 text-green-700 border-green-200' }
    case 'free_trial':
      return { label: `FREE · ${order.trial_days_left} day${order.trial_days_left === 1 ? '' : 's'} left`, cls: 'bg-blue-50 text-blue-700 border-blue-200' }
    case 'free_expired':
      return { label: 'TRIAL ENDED', cls: 'bg-red-50 text-red-700 border-red-200' }
    case 'free_unbuilt':
      return { label: 'FREE · not built yet', cls: 'bg-amber-50 text-amber-700 border-amber-200' }
    case 'pending_payment':
      return { label: 'PAYMENT PENDING', cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' }
    default:
      return { label: order.amount > 0 ? 'PAID' : 'FREE', cls: 'bg-gray-50 text-gray-600 border-gray-200' }
  }
}

export default function AppList({ showHeader = true }: { showHeader?: boolean }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: appsData, isLoading, isError } = useQuery({
    queryKey: ['apps'],
    queryFn: () => appsApi.list(),
    select: (res) => res.data,
  })

  const { data: ordersData } = useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersApi.list(1, 100),
    select: (res) => res.data,
  })

  const { data: plans } = useQuery({
    queryKey: ['plans'],
    queryFn: () => plansApi.list().then((r) => r.data),
  })

  // Drafts (wizard-in-progress configs) never show here.
  const apps = (appsData?.apps ?? []).filter((a) => a.status !== 'draft')
  const orders = ordersData?.orders ?? []
  const hasPaidOrder = orders.some((o) => o.amount > 0 && o.status === 'paid')
  // Up to 5 free SUCCESSFUL builds per account, lifetime (across all websites).
  const freeBuildUsed = orders.some(
    (o) => o.amount === 0 && (o.plan_state === 'free_trial' || o.plan_state === 'free_expired')
  )
  const isFreeUser = !hasPaidOrder
  const appLimit = isFreeUser ? 5 : Infinity
  const canCreateMore = apps.length < appLimit

  // Upgrade: create a paid order on the SAME app config, then pay on the
  // order page. The paid build reuses the app's current (editable) config.
  const upgrade = useMutation({
    mutationFn: async (appConfigId: string) => {
      const currency = getUserCurrency()
      const platformPlans = ((plans as Plan[]) || []).filter(
        (p) => p.platform === 'android' && (currency === 'INR' ? p.price_inr : p.price_usd) > 0
      )
      const plan = platformPlans.sort(
        (a, b) => (currency === 'INR' ? a.price_inr - b.price_inr : a.price_usd - b.price_usd)
      )[0]
      if (!plan) throw new Error('No paid plan available')
      const res = await ordersApi.create({
        app_config_id: appConfigId,
        plan_id: plan.id,
        currency,
        payment_gateway: 'razorpay',
      })
      return res.data
    },
    onSuccess: (order) => {
      navigate(`/orders/${order.id}`)
      toast.success('Complete the payment to build your premium app')
    },
    onError: () => toast.error('Could not start the upgrade. Please try again.'),
  })

  // Delete = remove from dashboard. Ordered apps are soft-deleted server-side,
  // so payment history and the lifetime free-build quota are unaffected.
  const deleteApp = useMutation({
    mutationFn: (appId: string) => appsApi.delete(appId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apps'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success('App deleted')
    },
    onError: () => toast.error('Could not delete the app. Please try again.'),
  })

  const confirmDelete = (appId: string, name: string) => {
    if (window.confirm(`Delete "${name}"?\n\nThis removes the app from your dashboard. Order history is kept, and any used free builds do NOT come back.`)) {
      deleteApp.mutate(appId)
    }
  }

  return (
    <div>
      {showHeader && (<>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-ink tracking-tight">My Apps</h1>
          <p className="mt-1 text-sm text-soft">
            Manage and track all your app conversions in one place
          </p>
          {freeBuildUsed && isFreeUser && (
            <p className="mt-1 text-sm text-amber-600 flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" />
              Free plan includes up to 5 builds across your websites — upgrade to remove the watermark and get monthly rebuilds
            </p>
          )}
        </div>
        {canCreateMore ? (
          <Link
            to="/apps/create"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition shadow-sm text-sm font-medium self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Create New App
          </Link>
        ) : (
          <Link
            to="/pricing"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition shadow-sm text-sm font-medium self-start sm:self-auto"
          >
            Upgrade to Premium
          </Link>
        )}
      </div>

      </>)}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl bg-red-50 border border-red-200 p-6 flex items-start gap-3 text-red-700">
          <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Failed to load apps</p>
            <p className="text-sm mt-1 text-red-600">Please try refreshing the page or contact support if the issue persists.</p>
          </div>
        </div>
      ) : apps.length === 0 ? (
        <div className="bg-surface rounded-2xl border-2 border-dashed border-line py-16 text-center">
          <div className="inline-flex p-4 rounded-full bg-primary-50 mb-5">
            <AppWindow className="w-12 h-12 text-primary-600" />
          </div>
          <h3 className="text-xl font-bold text-ink mb-2">
            No apps yet
          </h3>
          <p className="text-sm text-soft mb-6 max-w-md mx-auto">
            Start converting your websites into native Android and Windows apps in just a few minutes
          </p>
          <Link
            to="/apps/create"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create Your First App
          </Link>
        </div>
      ) : (
        <div className="bg-surface rounded-2xl border border-line divide-y divide-line shadow-[0_1px_3px_rgba(16,24,40,0.06)]">
          {apps.map((app) => {
            const appOrders = orders.filter((o) => o.app_config_id === app.id)
            const appOrder =
              appOrders.find((o) => o.plan_state === 'paid') ||
              appOrders.find((o) => o.plan_state === 'pending_payment' && appOrders.length === 1) ||
              appOrders[0]
            const detailUrl = appOrder ? `/orders/${appOrder.id}` : `/apps/${app.id}/edit`
            const chip = stateChip(appOrder)
            const isShared = !!app.is_shared
            const canEdit = !isShared || app.access_role === 'editor'
            // Upgrading creates a paid order — owner-only by design
            const showUpgrade = !isShared &&
              appOrder && (appOrder.plan_state === 'free_trial' || appOrder.plan_state === 'free_expired')
            return (
              <div key={app.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 hover:bg-gray-50 transition-colors">
                {/* Icon + name + URL */}
                <Link to={detailUrl} className="flex items-center gap-4 flex-1 min-w-0">
                  {app.icon_url ? (
                    <img src={app.icon_url} alt={app.name} className="w-12 h-12 rounded-xl object-cover border border-line shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl border border-line flex items-center justify-center shrink-0"
                         style={{ backgroundColor: app.primary_color || '#6366f1' }}>
                      <AppWindow className="w-6 h-6 text-white" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-ink truncate">{app.name}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${chip.cls}`}>
                        {appOrder?.plan_state === 'free_trial' && <Clock className="w-3 h-3 mr-1" />}
                        {chip.label}
                      </span>
                      {isShared && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border bg-purple-50 text-purple-700 border-purple-200">
                          SHARED · {app.access_role}
                        </span>
                      )}
                      {app.selected_platforms?.includes('android') && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 rounded-md text-[11px] font-medium"><Smartphone className="w-3 h-3" />Android</span>
                      )}
                      {app.selected_platforms?.includes('desktop') && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[11px] font-medium"><Monitor className="w-3 h-3" />Desktop</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 text-sm text-soft min-w-0">
                      <Globe className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate" title={app.url}>{app.url}</span>
                    </div>
                    {appOrder?.plan_state === 'paid' && (
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-soft">
                        <Hammer className="w-3 h-3 shrink-0" />
                        <span className={appOrder.rebuilds_left_this_month === 0 ? 'text-red-600 font-semibold' : ''}>
                          {appOrder.rebuilds_left_this_month ?? 5} rebuild{(appOrder.rebuilds_left_this_month ?? 5) !== 1 ? 's' : ''} left this month
                        </span>
                      </div>
                    )}
                  </div>
                </Link>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-end gap-2 w-full sm:w-auto sm:shrink-0 self-end sm:self-auto">
                  {canEdit && (
                    <Link
                      to={`/apps/${app.id}/edit`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-line text-soft hover:border-primary-300 hover:text-primary-700 text-sm font-medium transition"
                    >
                      <Pencil className="w-4 h-4" /> Edit
                    </Link>
                  )}
                  {!isShared && (
                    <button
                      onClick={() => confirmDelete(app.id, app.name)}
                      disabled={deleteApp.isPending}
                      title="Delete app"
                      className="inline-flex items-center px-2.5 py-2 rounded-lg border border-line text-soft hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  {showUpgrade ? (
                    <button
                      onClick={() => upgrade.mutate(app.id)}
                      disabled={upgrade.isPending}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold text-sm transition ${
                        appOrder?.plan_state === 'free_expired'
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 shadow'
                          : 'bg-primary-50 text-primary-700 border-2 border-primary-200 hover:bg-primary-100'
                      }`}
                    >
                      {upgrade.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                      {appOrder?.plan_state === 'free_expired' ? 'Reactivate — pay & upgrade' : 'Pay & upgrade'}
                    </button>
                  ) : (
                    <Link
                      to={detailUrl}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-100 text-ink hover:bg-gray-200 text-sm font-medium transition"
                    >
                      View <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
