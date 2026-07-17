import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { appsApi } from '@/api/apps'
import { ordersApi, plansApi } from '@/api/orders'
import { formatDate, getUserCurrency } from '@/utils/format'
import type { Order, Plan } from '@/types'
import { AppWindow, Plus, Globe, Loader2, AlertCircle, Smartphone, Monitor, ArrowRight, AlertTriangle, Pencil, Hammer, Clock, Zap } from 'lucide-react'

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

export default function MyApps() {
  const navigate = useNavigate()
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
  // One free SUCCESSFUL build per account, lifetime.
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

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Apps</h1>
          <p className="mt-2 text-gray-600">
            Manage and track all your app conversions in one place
          </p>
          {freeBuildUsed && isFreeUser && (
            <p className="mt-1 text-sm text-amber-600 flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" />
              Your one free build is used — new apps and rebuilds are on paid plans
            </p>
          )}
        </div>
        {canCreateMore ? (
          <Link
            to="/apps/create"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg shadow-primary-200 hover:shadow-xl font-medium self-start sm:self-auto"
          >
            <Plus className="w-5 h-5" />
            Create New App
          </Link>
        ) : (
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg font-medium self-start sm:self-auto"
          >
            Upgrade to Premium
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
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
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center">
          <div className="inline-flex p-5 rounded-full bg-primary-50 mb-6">
            <AppWindow className="w-16 h-16 text-primary-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            No apps yet
          </h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Start converting your websites into native Android and Windows apps in just a few minutes
          </p>
          <Link
            to="/apps/create"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition font-medium shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Create Your First App
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {apps.map((app) => {
            // Prefer the paid order for state; else the most recent one.
            const appOrders = orders.filter((o) => o.app_config_id === app.id)
            const appOrder =
              appOrders.find((o) => o.plan_state === 'paid') ||
              appOrders.find((o) => o.plan_state === 'pending_payment' && appOrders.length === 1) ||
              appOrders[0]
            const detailUrl = appOrder ? `/orders/${appOrder.id}` : `/apps/${app.id}/edit`
            const chip = stateChip(appOrder)
            const showUpgrade =
              appOrder && (appOrder.plan_state === 'free_trial' || appOrder.plan_state === 'free_expired')
            return (
            <div
              key={app.id}
              className="group relative bg-white rounded-2xl border-2 border-gray-100 hover:border-primary-300 hover:shadow-xl transition-all overflow-hidden"
            >
              {/* Edit — always available, including free apps (edit, then pay to build) */}
              <Link
                to={`/apps/${app.id}/edit`}
                onClick={(e) => e.stopPropagation()}
                className="absolute top-3 right-3 z-10 p-1.5 rounded-lg bg-gray-100 hover:bg-primary-100 hover:text-primary-700 text-gray-500 transition-colors"
                title="Edit app"
              >
                <Pencil className="w-4 h-4" />
              </Link>
              <Link to={detailUrl} className="block p-6 pb-4">
                <div className="flex items-start gap-4 mb-4">
                  {app.icon_url ? (
                    <img
                      src={app.icon_url}
                      alt={app.name}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-gray-100 shrink-0"
                    />
                  ) : (
                    <div
                      className="w-16 h-16 rounded-2xl border-2 border-gray-100 flex items-center justify-center shrink-0"
                      style={{ backgroundColor: app.primary_color || '#6366f1' }}
                    >
                      <AppWindow className="w-8 h-8 text-white" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-primary-600 transition">
                      {app.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5 text-sm text-gray-500">
                      <Globe className="w-4 h-4 shrink-0" />
                      <span className="truncate" title={app.url}>{app.url}</span>
                    </div>
                  </div>
                </div>

                {(app.selected_platforms && app.selected_platforms.length > 0) && (
                  <div className="flex gap-2 mb-4">
                    {app.selected_platforms.includes('android') && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium">
                        <Smartphone className="w-3.5 h-3.5" />
                        Android
                      </span>
                    )}
                    {app.selected_platforms.includes('desktop') && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium">
                        <Monitor className="w-3.5 h-3.5" />
                        Desktop
                      </span>
                    )}
                  </div>
                )}

                <div className="pt-4 border-t-2 border-gray-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${chip.cls}`}>
                      {appOrder?.plan_state === 'free_trial' && <Clock className="w-3.5 h-3.5 mr-1" />}
                      {chip.label}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500 group-hover:text-primary-600 transition">
                      <span className="hidden sm:inline">View details</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                  {appOrder?.plan_state === 'paid' && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Hammer className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        <span className={appOrder.rebuilds_left_this_month === 0 ? 'text-red-600 font-semibold' : 'text-gray-700 font-medium'}>
                          {appOrder.rebuilds_left_this_month ?? 3} rebuild{(appOrder.rebuilds_left_this_month ?? 3) !== 1 ? 's' : ''} left
                        </span>
                        {' '}this month (resets on the 1st)
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-gray-50">
                  <span className="text-xs text-gray-400">
                    Created {formatDate(app.created_at)}
                  </span>
                </div>
              </Link>

              {/* Primary action for free apps: pay -> we build the premium app
                  from this app's current config (edits included). */}
              {showUpgrade && (
                <div className="px-6 pb-5">
                  <button
                    onClick={() => upgrade.mutate(app.id)}
                    disabled={upgrade.isPending}
                    className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                      appOrder?.plan_state === 'free_expired'
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 shadow-lg'
                        : 'bg-primary-50 text-primary-700 border border-primary-200 hover:bg-primary-100'
                    }`}
                  >
                    {upgrade.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    {appOrder?.plan_state === 'free_expired' ? 'Reactivate — pay & upgrade' : 'Pay & upgrade to Premium'}
                  </button>
                </div>
              )}
            </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
