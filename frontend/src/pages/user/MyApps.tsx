import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { appsApi } from '@/api/apps'
import { ordersApi } from '@/api/orders'
import { formatDate } from '@/utils/format'
import { AppWindow, Plus, Globe, Loader2, AlertCircle, Smartphone, Monitor, ArrowRight, AlertTriangle, Pencil, Hammer } from 'lucide-react'

const statusColors: Record<string, string> = {
  draft: 'bg-amber-50 text-amber-700 border border-amber-200',
  active: 'bg-green-50 text-green-700 border border-green-200',
  pending: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  building: 'bg-blue-50 text-blue-700 border border-blue-200',
  disabled: 'bg-red-50 text-red-700 border border-red-200',
}

export default function MyApps() {
  const {
    data: appsData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['apps'],
    queryFn: () => appsApi.list(),
    select: (res) => res.data,
  })

  const { data: ordersData } = useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersApi.list(1, 100),
    select: (res) => res.data,
  })

  const apps = appsData?.apps ?? []
  const orders = ordersData?.orders ?? []
  const hasPaidOrder = orders.some((o) => o.amount > 0 && o.status === 'paid')
  const isFreeUser = !hasPaidOrder
  const appLimit = isFreeUser ? 5 : Infinity
  const canCreateMore = apps.length < appLimit

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Apps</h1>
          <p className="mt-2 text-gray-600">
            Manage and track all your app conversions in one place
          </p>
          {isFreeUser && (
            <p className="mt-1 text-sm text-amber-600 flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" />
              Free plan: {apps.length}/5 apps used
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

      {/* Free plan limit banner */}
      {isFreeUser && apps.length >= 5 && (
        <div className="mb-6 bg-amber-50 border-2 border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">App limit reached</p>
            <p className="text-sm text-amber-700">
              Free plan allows maximum 5 apps.{' '}
              <Link to="/pricing" className="text-primary-600 font-semibold hover:underline">
                Upgrade to Premium
              </Link>{' '}
              to create unlimited apps with no watermark and no trial limit.
            </p>
          </div>
        </div>
      )}

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
            const appOrder = orders.find((o) => o.app_config_id === app.id)
            const detailUrl = appOrder ? `/orders/${appOrder.id}` : `/apps/${app.id}/edit`
            const isPaid = appOrder && appOrder.amount > 0
            const buildLimit = isPaid ? 5 : 2
            const buildsUsed = appOrder?.build_count ?? 0
            const buildsLeft = Math.max(0, buildLimit - buildsUsed)
            return (
            <div
              key={app.id}
              className="group relative bg-white rounded-2xl border-2 border-gray-100 hover:border-primary-300 hover:shadow-xl transition-all overflow-hidden"
            >
              {/* Edit button */}
              <Link
                to={`/apps/${app.id}/edit`}
                onClick={(e) => e.stopPropagation()}
                className="absolute top-3 right-3 z-10 p-1.5 rounded-lg bg-gray-100 hover:bg-primary-100 hover:text-primary-700 text-gray-500 transition-colors"
                title="Edit app"
              >
                <Pencil className="w-4 h-4" />
              </Link>
              <Link to={detailUrl} className="block p-6 h-full">
                {/* Header with icon and name */}
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
                      style={{
                        backgroundColor: app.primary_color || '#6366f1',
                      }}
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
                      <span className="truncate">{new URL(app.url).hostname}</span>
                    </div>
                  </div>
                </div>

                {/* Platform badges */}
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

                {/* Footer */}
                <div className="pt-4 border-t-2 border-gray-50 space-y-2">
                  <div className="flex items-center justify-between">
                    {appOrder ? (
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${isPaid ? 'bg-primary-50 text-primary-700 border border-primary-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                        {isPaid ? 'Paid Plan' : 'Free Plan'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-50 text-gray-500 border border-gray-200">
                        No order
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500 group-hover:text-primary-600 transition">
                      <span className="hidden sm:inline">View details</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                  {appOrder && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Hammer className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        <span className={buildsLeft === 0 ? 'text-red-600 font-semibold' : 'text-gray-700 font-medium'}>
                          {buildsLeft} build{buildsLeft !== 1 ? 's' : ''} remaining
                        </span>
                        {' '}of {buildLimit}
                      </span>
                    </div>
                  )}
                </div>

                {/* Creation date */}
                <div className="mt-3 pt-3 border-t border-gray-50">
                  <span className="text-xs text-gray-400">
                    Created {formatDate(app.created_at)}
                  </span>
                </div>
              </Link>
            </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
