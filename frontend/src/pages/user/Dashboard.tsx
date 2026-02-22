import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { ordersApi, subscriptionsApi } from '@/api/orders'
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
  CreditCard,
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

  const { data: activeSubscription } = useQuery({
    queryKey: ['subscription', 'active'],
    queryFn: () => subscriptionsApi.getActive().then((r) => r.data),
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
    <div>
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.full_name ?? 'User'}
        </h1>
        <p className="mt-1 text-gray-500">
          Here's an overview of your apps and orders.
        </p>
      </div>

      {/* Quick Stats */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : isError ? (
        <div className="rounded-lg bg-red-50 p-4 mb-6 flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>Failed to load dashboard data. Please try refreshing the page.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl border p-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary-50 text-primary-600">
                <AppWindow className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Apps</p>
                <p className="text-2xl font-bold text-gray-900">{totalApps}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border p-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Active Orders</p>
                <p className="text-2xl font-bold text-gray-900">
                  {activeOrders}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl border p-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-50 text-green-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Completed Builds</p>
                <p className="text-2xl font-bold text-gray-900">
                  {completedBuilds}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3 mb-8">
            <Link
              to="/apps/create"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Create New App
            </Link>
            <Link
              to="/orders"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
            >
              <LayoutDashboard className="w-4 h-4" />
              View Orders
            </Link>
          </div>

          {/* Subscription Status */}
          {activeSubscription ? (
            <div className="bg-white rounded-xl border p-5 mb-8 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-50 text-green-600">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {activeSubscription.plan_name ?? 'Monthly'} Plan
                  </p>
                  <p className="text-xs text-gray-500">
                    {activeSubscription.current_period_end
                      ? `Next billing: ${formatDate(activeSubscription.current_period_end)}`
                      : 'Active subscription'}
                  </p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active
                </span>
              </div>
              <Link
                to="/subscription"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-1"
              >
                Manage <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl border border-primary-100 p-5 mb-8 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary-100 text-primary-600">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Upgrade to Pro</p>
                  <p className="text-xs text-gray-500">Get monthly builds and premium features.</p>
                </div>
              </div>
              <Link
                to="/pricing"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
              >
                View Plans <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Recent Orders */}
          <div className="bg-white rounded-xl border">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Orders
              </h2>
              {orders.length > 5 && (
                <Link
                  to="/orders"
                  className="text-sm text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
                >
                  View all <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>

            {recentOrders.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <ShoppingCart className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No orders yet.</p>
                <Link
                  to="/apps/create"
                  className="text-primary-600 hover:text-primary-700 text-sm mt-1 inline-block"
                >
                  Create your first app to get started
                </Link>
              </div>
            ) : (
              <div className="divide-y">
                {recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    to={`/orders/${order.id}`}
                    className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {order.order_number}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {order.app_name ?? 'App'} &middot;{' '}
                        {order.plan_name ?? 'Plan'}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 ml-4">
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(order.amount, order.currency)}
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status] ?? 'bg-gray-100 text-gray-800'}`}
                      >
                        {order.status}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDate(order.created_at)}
                      </span>
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
