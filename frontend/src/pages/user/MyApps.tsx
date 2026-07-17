import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { appsApi } from '@/api/apps'
import { ordersApi, plansApi } from '@/api/orders'
import { getUserCurrency } from '@/utils/format'
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
        <div className="bg-white rounded-2xl border-2 border-gray-100 divide-y divide-gray-100">
          {apps.map((app) => {
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
              <div key={app.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 hover:bg-gray-50 transition">
                {/* Icon + name + URL */}
                <Link to={detailUrl} className="flex items-center gap-4 flex-1 min-w-0">
                  {app.icon_url ? (
                    <img src={app.icon_url} alt={app.name} className="w-12 h-12 rounded-xl object-cover border-2 border-gray-100 shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl border-2 border-gray-100 flex items-center justify-center shrink-0"
                         style={{ backgroundColor: app.primary_color || '#6366f1' }}>
                      <AppWindow className="w-6 h-6 text-white" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-900 truncate">{app.name}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${chip.cls}`}>
                        {appOrder?.plan_state === 'free_trial' && <Clock className="w-3 h-3 mr-1" />}
                        {chip.label}
                      </span>
                      {app.selected_platforms?.includes('android') && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 rounded-md text-[11px] font-medium"><Smartphone className="w-3 h-3" />Android</span>
                      )}
                      {app.selected_platforms?.includes('desktop') && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[11px] font-medium"><Monitor className="w-3 h-3" />Desktop</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500 min-w-0">
                      <Globe className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate" title={app.url}>{app.url}</span>
                    </div>
                    {appOrder?.plan_state === 'paid' && (
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
                        <Hammer className="w-3 h-3 shrink-0" />
                        <span className={appOrder.rebuilds_left_this_month === 0 ? 'text-red-600 font-semibold' : ''}>
                          {appOrder.rebuilds_left_this_month ?? 3} rebuild{(appOrder.rebuilds_left_this_month ?? 3) !== 1 ? 's' : ''} left this month
                        </span>
                      </div>
                    )}
                  </div>
                </Link>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <Link
                    to={`/apps/${app.id}/edit`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 border-gray-200 text-gray-600 hover:border-primary-300 hover:text-primary-700 text-sm font-medium transition"
                  >
                    <Pencil className="w-4 h-4" /> Edit
                  </Link>
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
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm font-medium transition"
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
