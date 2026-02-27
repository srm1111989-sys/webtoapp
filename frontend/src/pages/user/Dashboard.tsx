import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { ordersApi, paymentsApi } from '@/api/orders'
import { appsApi } from '@/api/apps'
import { formatCurrency, formatDate } from '@/utils/format'
import {
  LayoutDashboard,
  AppWindow,
  ShoppingCart,
  CheckCircle2,
  Plus,
  ArrowRight,
  Loader2,
  AlertCircle,
  FlaskConical,
} from 'lucide-react'

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  building: 'bg-blue-100 text-blue-800',
  success: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
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

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 sm:p-8 text-white shadow-lg">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
          Welcome back, {user?.full_name ?? 'User'} 👋
        </h1>
        <p className="text-primary-100 text-sm sm:text-base">
          Manage your mobile apps and track your orders from one place
        </p>
      </div>

      {/* Quick Stats */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
        </div>
      ) : isError ? (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 sm:p-6 flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm sm:text-base">Failed to load dashboard data. Please try refreshing the page.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 text-primary-600">
                  <AppWindow className="w-7 h-7" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-900">{totalApps}</p>
                  <p className="text-xs text-gray-500 mt-1">Total Apps</p>
                </div>
              </div>
              <div className="h-1 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full"></div>
            </div>

            <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600">
                  <ShoppingCart className="w-7 h-7" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-900">{activeOrders}</p>
                  <p className="text-xs text-gray-500 mt-1">Active Orders</p>
                </div>
              </div>
              <div className="h-1 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"></div>
            </div>

            <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-50 to-green-100 text-green-600">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-900">{completedBuilds}</p>
                  <p className="text-xs text-gray-500 mt-1">Completed Builds</p>
                </div>
              </div>
              <div className="h-1 bg-gradient-to-r from-green-400 to-green-600 rounded-full"></div>
            </div>
          </div>

          {/* Test Mode Banner */}
          {paymentMode?.test_mode && (
            <div className="flex items-start gap-3 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-5 shadow-sm">
              <div className="p-2 rounded-lg bg-amber-100">
                <FlaskConical className="w-5 h-5 text-amber-700 shrink-0" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-900 mb-1">Payment Test Mode Active</p>
                <p className="text-xs text-amber-700">Using test gateway credentials. No real charges will be made. Use test card numbers at checkout.</p>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/apps/create"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg shadow-primary-200 hover:shadow-xl font-medium"
            >
              <Plus className="w-5 h-5" />
              Create New App
            </Link>
            <Link
              to="/orders"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:border-gray-300 hover:shadow-md transition-all font-medium"
            >
              <LayoutDashboard className="w-5 h-5" />
              View All Orders
            </Link>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b-2 border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
              <h2 className="text-xl font-bold text-gray-900">
                Recent Orders
              </h2>
              {orders.length > 5 && (
                <Link
                  to="/orders"
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-1.5 hover:gap-2 transition-all"
                >
                  View all <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>

            {recentOrders.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <div className="inline-flex p-4 rounded-full bg-gray-100 mb-4">
                  <ShoppingCart className="w-12 h-12 text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium mb-2">No orders yet</p>
                <p className="text-gray-500 text-sm mb-4">Start by creating your first mobile app</p>
                <Link
                  to="/apps/create"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Create App
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    to={`/orders/${order.id}`}
                    className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 hover:bg-gradient-to-r hover:from-gray-50 hover:to-white transition-all gap-2 sm:gap-0 group"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-600 transition">
                        {order.order_number}
                      </p>
                      <p className="text-sm text-gray-600 truncate mt-0.5">
                        {order.app_name ?? 'App'} <span className="text-gray-400">•</span> {order.plan_name ?? 'Plan'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-bold text-gray-900">
                        {formatCurrency(order.amount, order.currency)}
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[order.status] ?? 'bg-gray-100 text-gray-800'}`}
                      >
                        {order.status}
                      </span>
                      <span className="hidden sm:block text-xs text-gray-400 min-w-[80px] text-right">
                        {formatDate(order.created_at)}
                      </span>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
