import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { subscriptionsApi } from '@/api/orders'
import { formatCurrency, formatDate } from '@/utils/format'
import {
  CreditCard,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react'
import type { Subscription as SubscriptionType } from '@/types'

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  active: { label: 'Active', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  halted: { label: 'Payment Failed', color: 'bg-red-100 text-red-800', icon: AlertTriangle },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-800', icon: XCircle },
  expired: { label: 'Expired', color: 'bg-gray-100 text-gray-800', icon: XCircle },
}

export default function Subscription() {
  const queryClient = useQueryClient()
  const [showCancelConfirm, setShowCancelConfirm] = useState<string | null>(null)

  const {
    data: activeSubscription,
    isLoading: activeLoading,
  } = useQuery({
    queryKey: ['subscription', 'active'],
    queryFn: () => subscriptionsApi.getActive().then((r) => r.data),
  })

  const {
    data: allSubscriptions,
    isLoading: listLoading,
  } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => subscriptionsApi.list().then((r) => r.data),
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => subscriptionsApi.cancel(id),
    onSuccess: () => {
      toast.success('Subscription cancelled.')
      setShowCancelConfirm(null)
      queryClient.invalidateQueries({ queryKey: ['subscription'] })
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
    },
    onError: () => {
      toast.error('Failed to cancel subscription.')
    },
  })

  const isLoading = activeLoading || listLoading
  const pastSubscriptions = allSubscriptions?.filter(
    (s) => s.id !== activeSubscription?.id
  ) ?? []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Subscription</h1>
        <p className="mt-1 text-gray-500">Manage your subscription plan and billing.</p>
      </div>

      {/* Active Subscription Card */}
      {activeSubscription ? (
        <ActiveSubscriptionCard
          subscription={activeSubscription}
          onCancel={() => setShowCancelConfirm(activeSubscription.id)}
        />
      ) : (
        <div className="bg-white rounded-xl border p-8 text-center mb-8">
          <CreditCard className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">No Active Subscription</h2>
          <p className="text-gray-500 mb-4">
            Subscribe to a monthly plan to get continuous builds and updates.
          </p>
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
          >
            View Plans <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Past Subscriptions */}
      {pastSubscriptions.length > 0 && (
        <div className="bg-white rounded-xl border mt-6">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Subscription History</h2>
          </div>
          <div className="divide-y">
            {pastSubscriptions.map((sub) => {
              const cfg = statusConfig[sub.status] ?? statusConfig.expired
              return (
                <div key={sub.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {sub.plan_name ?? 'Plan'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {sub.gateway.charAt(0).toUpperCase() + sub.gateway.slice(1)} &middot; Started {formatDate(sub.created_at)}
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                    {cfg.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-red-100">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Cancel Subscription?</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Your subscription will remain active until the end of the current billing period.
              After that, you won't be charged again and your subscription features will be disabled.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCancelConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Keep Subscription
              </button>
              <button
                onClick={() => cancelMutation.mutate(showCancelConfirm)}
                disabled={cancelMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
              >
                {cancelMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Yes, Cancel'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ActiveSubscriptionCard({
  subscription,
  onCancel,
}: {
  subscription: SubscriptionType
  onCancel: () => void
}) {
  const cfg = statusConfig[subscription.status] ?? statusConfig.active
  const StatusIcon = cfg.icon

  return (
    <div className="bg-white rounded-xl border p-6 mb-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{subscription.plan_name ?? 'Subscription'}</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {subscription.gateway.charAt(0).toUpperCase() + subscription.gateway.slice(1)} subscription
          </p>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${cfg.color}`}>
          <StatusIcon className="w-4 h-4" />
          {cfg.label}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Started</p>
          <p className="text-sm font-medium text-gray-900 mt-1">
            {subscription.current_period_start
              ? formatDate(subscription.current_period_start)
              : formatDate(subscription.created_at)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Next Billing Date</p>
          <p className="text-sm font-medium text-gray-900 mt-1">
            {subscription.current_period_end
              ? formatDate(subscription.current_period_end)
              : '-'}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Gateway</p>
          <p className="text-sm font-medium text-gray-900 mt-1 capitalize">{subscription.gateway}</p>
        </div>
      </div>

      {(subscription.status === 'active' || subscription.status === 'pending') && (
        <button
          onClick={onCancel}
          className="text-sm text-red-600 hover:text-red-700 font-medium"
        >
          Cancel Subscription
        </button>
      )}
    </div>
  )
}
