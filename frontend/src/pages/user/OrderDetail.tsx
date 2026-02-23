import { Link, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ordersApi, buildsApi } from '@/api/orders'
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format'
import type { Build } from '@/types'
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  RefreshCw,
  XCircle,
  Hammer,
} from 'lucide-react'

const orderStatusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
}

const buildStatusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  building: 'bg-blue-100 text-blue-800',
  success: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
}

const buildStatusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="w-5 h-5 text-yellow-600" />,
  building: <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />,
  success: <CheckCircle2 className="w-5 h-5 text-green-600" />,
  failed: <XCircle className="w-5 h-5 text-red-600" />,
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()

  const {
    data: order,
    isLoading: orderLoading,
    isError: orderError,
  } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.get(id!),
    select: (res) => res.data,
    enabled: !!id,
  })

  const {
    data: builds,
    isLoading: buildsLoading,
    isError: buildsError,
  } = useQuery({
    queryKey: ['builds', id],
    queryFn: () => buildsApi.getForOrder(id!),
    select: (res) => res.data,
    enabled: !!id,
    refetchInterval: (query) => {
      const data = query.state.data
      if (!data || !Array.isArray(data)) return false
      const hasActiveBuilds = data.some(
        (b: Build) => b.status === 'building' || b.status === 'pending'
      )
      return hasActiveBuilds ? 5000 : false
    },
  })

  const triggerBuild = useMutation({
    mutationFn: (platform: string = 'android') => buildsApi.trigger(id!, platform),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['builds', id] })
    },
  })

  const isLoading = orderLoading || buildsLoading
  const isError = orderError || buildsError

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (isError || !order) {
    return (
      <div className="rounded-lg bg-red-50 p-4 flex items-center gap-3 text-red-700">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <p>Failed to load order details. Please try again.</p>
      </div>
    )
  }

  const latestBuild = builds && builds.length > 0 ? builds[0] : null

  return (
    <div>
      {/* Back link */}
      <Link
        to="/orders"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Orders
      </Link>

      {/* Order Header */}
      <div className="bg-white rounded-xl border p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Order {order.order_number}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Placed on {formatDateTime(order.created_at)}
            </p>
          </div>
          <span
            className={`inline-flex items-center self-start px-3 py-1 rounded-full text-sm font-medium ${orderStatusColors[order.status] ?? 'bg-gray-100 text-gray-800'}`}
          >
            {order.status}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
              Amount
            </p>
            <p className="text-lg font-semibold text-gray-900">
              {formatCurrency(order.amount, order.currency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
              Plan
            </p>
            <p className="text-lg font-semibold text-gray-900">
              {order.plan_name ?? '-'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
              App
            </p>
            <p className="text-lg font-semibold text-gray-900">
              {order.app_name ?? '-'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
              Payment
            </p>
            <p className="text-lg font-semibold text-gray-900">
              {order.payment_gateway ?? '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Build Status */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Hammer className="w-5 h-5 text-gray-400" />
            Build Status
          </h2>
          {order.status === 'paid' && (
            <div className="flex items-center gap-2">
              {(!order.selected_platforms || order.selected_platforms.includes('android')) && (
                <button
                  onClick={() => triggerBuild.mutate('android')}
                  disabled={
                    triggerBuild.isPending ||
                    (latestBuild !== null &&
                      (latestBuild.status === 'building' ||
                        latestBuild.status === 'pending'))
                  }
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {triggerBuild.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Build Android
                </button>
              )}
              {order.selected_platforms?.includes('desktop') && (
                <button
                  onClick={() => triggerBuild.mutate('desktop')}
                  disabled={
                    triggerBuild.isPending ||
                    (latestBuild !== null &&
                      (latestBuild.status === 'building' ||
                        latestBuild.status === 'pending'))
                  }
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {triggerBuild.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Build Windows
                </button>
              )}
            </div>
          )}
        </div>

        {triggerBuild.isError && (
          <div className="rounded-lg bg-red-50 p-3 mb-4 flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            Failed to trigger build. Please try again.
          </div>
        )}

        {!builds || builds.length === 0 ? (
          <div className="text-center py-10">
            <Hammer className="w-10 h-10 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No builds yet.</p>
            {order.status === 'paid' && (
              <p className="text-sm text-gray-400 mt-1">
                Trigger a build to generate your {
                  order.selected_platforms?.includes('desktop') && !order.selected_platforms?.includes('android')
                    ? 'Windows EXE'
                    : order.selected_platforms?.includes('desktop')
                      ? 'APK, AAB, and EXE files'
                      : 'APK and AAB files'
                }.
              </p>
            )}
            {order.status === 'pending' && (
              <p className="text-sm text-gray-400 mt-1">
                Complete payment to start building your app.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {builds.map((build: Build) => (
              <div
                key={build.id}
                className="border rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {buildStatusIcons[build.status] ?? (
                      <Clock className="w-5 h-5 text-gray-400" />
                    )}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${buildStatusColors[build.status] ?? 'bg-gray-100 text-gray-800'}`}
                        >
                          {build.status}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            build.platform === 'desktop'
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {build.platform === 'desktop' ? 'Windows' : 'Android'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {build.build_type} &middot;{' '}
                        {formatDateTime(build.created_at)}
                      </p>
                    </div>
                  </div>

                  {build.status === 'building' && (
                    <span className="text-sm text-blue-600 font-medium flex items-center gap-1.5">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Building...
                    </span>
                  )}
                </div>

                {/* Download buttons on success */}
                {build.status === 'success' && (
                  <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t">
                    {build.apk_url && (
                      <a
                        href={build.apk_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
                      >
                        <Download className="w-4 h-4" />
                        Download APK
                      </a>
                    )}
                    {build.aab_url && (
                      <a
                        href={build.aab_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                      >
                        <Download className="w-4 h-4" />
                        Download AAB
                      </a>
                    )}
                    {build.exe_url && (
                      <a
                        href={build.exe_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
                      >
                        <Download className="w-4 h-4" />
                        Download .exe
                      </a>
                    )}
                  </div>
                )}

                {/* Error message on failure */}
                {build.status === 'failed' && build.error_message && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="rounded-lg bg-red-50 p-3 flex items-start gap-2 text-red-700 text-sm">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Build failed</p>
                        <p className="mt-0.5 text-red-600">
                          {build.error_message}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Timestamps */}
                {(build.started_at || build.completed_at) && (
                  <div className="mt-3 pt-3 border-t flex gap-6 text-xs text-gray-400">
                    {build.started_at && (
                      <span>Started: {formatDateTime(build.started_at)}</span>
                    )}
                    {build.completed_at && (
                      <span>
                        Completed: {formatDateTime(build.completed_at)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
