import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { ordersApi, paymentsApi } from '@/api/orders'
import { appsApi } from '@/api/apps'
import { formatCurrency, formatDate } from '@/utils/format'
import {
  AppWindow,
  ShoppingCart,
  CheckCircle2,
  Plus,
  ArrowRight,
  Loader2,
  AlertCircle,
  FlaskConical,
} from 'lucide-react'

const statusStyles: Record<string, { dot: string; text: string }> = {
  pending: { dot: 'bg-amber-500', text: 'text-amber-700' },
  paid: { dot: 'bg-emerald-500', text: 'text-emerald-700' },
  building: { dot: 'bg-blue-500', text: 'text-blue-700' },
  success: { dot: 'bg-emerald-500', text: 'text-emerald-700' },
  failed: { dot: 'bg-red-500', text: 'text-red-700' },
  refunded: { dot: 'bg-gray-400', text: 'text-gray-600' },
}

export default function Dashboard() {
  const { user } = useAuthStore()

  const {
    data: ordersData,
    isLoading: ordersLoading,
    isError: ordersError,
  } = useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersApi.list(1, 20),
    select: (res) => res.data,
  })

  const {
    data: appsData,
    isLoading: appsLoading,
    isError: appsError,
  } = useQuery({
    queryKey: ['apps'],
    queryFn: () => appsApi.list(),
    select: (res) => res.data,
  })

  const { data: paymentMode } = useQuery({
    queryKey: ['payment-mode'],
    queryFn: () => paymentsApi.getPaymentMode().then((r) => r.data),
  })

  const totalApps = appsData?.total ?? 0
  const orders = ordersData?.orders ?? []
  const activeOrders = orders.filter(
    (o) => o.status === 'pending' || o.status === 'paid'
  ).length
  const completedBuilds = orders.filter((o) =>
    o.builds?.some((b) => b.status === 'success')
  ).length
  const recentOrders = orders.slice(0, 5)

  const isLoading = ordersLoading || appsLoading
  const isError = ordersError || appsError

  const stats = [
    { label: 'Total Apps', value: totalApps, icon: AppWindow, color: 'text-primary-600 bg-primary-50' },
    { label: 'Active Orders', value: activeOrders, icon: ShoppingCart, color: 'text-blue-600 bg-blue-50' },
    { label: 'Completed Builds', value: completedBuilds, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
  ]

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            Welcome back, {user?.full_name ?? 'User'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage your apps and track your orders
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/orders"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50 transition"
          >
            View orders
          </Link>
          <Link
            to="/apps/create"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Create app
          </Link>
        </div>
      </div>

      {/* Test Mode Banner */}
      {paymentMode?.test_mode && (
        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-md px-3 py-2.5">
          <FlaskConical className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-medium text-amber-900">Payment test mode active.</span>{' '}
            <span className="text-amber-700">
              No real charges will be made. Use test card numbers at checkout.
            </span>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
        </div>
      ) : isError ? (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 flex items-center gap-2 text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p className="text-sm">Failed to load dashboard data. Please refresh the page.</p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {stats.map(({ label, value, icon: Icon, color }) => (
              <div
                key={label}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-md ${color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="text-xl font-semibold text-gray-900 leading-tight">{value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Recent orders</h2>
              {orders.length > 5 && (
                <Link
                  to="/orders"
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-1"
                >
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>

            {recentOrders.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="inline-flex p-3 rounded-full bg-gray-50 mb-3">
                  <ShoppingCart className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-700 font-medium mb-1">No orders yet</p>
                <p className="text-xs text-gray-500 mb-4">Start by creating your first mobile app</p>
                <Link
                  to="/apps/create"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition text-sm font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create app
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentOrders.map((order) => {
                  const status = statusStyles[order.status] ?? { dot: 'bg-gray-400', text: 'text-gray-600' }
                  return (
                    <Link
                      key={order.id}
                      to={`/orders/${order.id}`}
                      className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 hover:bg-gray-50 transition group gap-1.5 sm:gap-4"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate group-hover:text-primary-600 transition">
                          {order.order_number}
                        </p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {order.app_name ?? 'App'} · {order.plan_name ?? 'Plan'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm font-medium text-gray-900 tabular-nums">
                          {formatCurrency(order.amount, order.currency)}
                        </span>
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${status.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                          {order.status}
                        </span>
                        <span className="hidden sm:block text-xs text-gray-400 min-w-[72px] text-right tabular-nums">
                          {formatDate(order.created_at)}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
