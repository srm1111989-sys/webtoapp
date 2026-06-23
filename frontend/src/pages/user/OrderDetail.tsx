import { Link, useParams } from 'react-router-dom'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ordersApi, buildsApi, paymentsApi } from '@/api/orders'
import { createRazorpayOrder } from '@/api/razorpay-proxy'
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format'
import type { Build } from '@/types'
import toast from 'react-hot-toast'
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
  CreditCard,
} from 'lucide-react'

const orderStatusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  free: 'bg-blue-100 text-blue-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
}

const orderLabel = (status: string, amount: number) =>
  status === 'paid' && amount === 0 ? 'free' : status

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
  const [isPaying, setIsPaying] = useState(false)

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

  const { data: paymentMode } = useQuery({
    queryKey: ['payment-mode'],
    queryFn: () => paymentsApi.getPaymentMode().then((r) => r.data),
  })

  const triggerBuild = useMutation({
    mutationFn: (platform: string = 'android') => buildsApi.trigger(id!, platform),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['builds', id] })
    },
  })

  const handleRazorpay = (
    data: { razorpay_order_id: string; razorpay_key_id: string; amount: number; currency: string; order_id: string },
  ) => {
    const options = {
      key: data.razorpay_key_id,
      amount: data.amount,
      currency: data.currency,
      order_id: data.razorpay_order_id,
      handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
        try {
          await paymentsApi.verifyRazorpay({
            order_id: data.order_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          })
          toast.success('Payment successful!')
          queryClient.invalidateQueries({ queryKey: ['order', id] })
          queryClient.invalidateQueries({ queryKey: ['orders'] })
        } catch {
          toast.error('Payment verification failed. Please contact support.')
        } finally {
          setIsPaying(false)
        }
      },
    }
    const rzp = new (window as any).Razorpay(options)
    rzp.open()
  }

  const handlePay = async () => {
    if (!order) return
    setIsPaying(true)
    try {
      if (paymentMode?.gateways?.razorpay) {
        const rpRes = await createRazorpayOrder({
          amount: order.amount,
          currency: order.currency,
          receipt: order.order_number,
          test_mode: paymentMode?.test_mode,
        })
        handleRazorpay({ ...rpRes, order_id: order.id })
      } else if (paymentMode?.gateways?.stripe) {
        const stripeRes = await paymentsApi.createStripeCheckout(order.id)
        window.location.href = stripeRes.data.checkout_url
      } else {
        toast.error('No payment gateway configured. Contact support.')
        setIsPaying(false)
      }
    } catch {
      toast.error('Payment initialization failed. Please try again.')
      setIsPaying(false)
    }
  }

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
            className={`inline-flex items-center self-start px-3 py-1 rounded-full text-sm font-medium ${orderStatusColors[orderLabel(order.status, order.amount)] ?? 'bg-gray-100 text-gray-800'}`}
          >
            {orderLabel(order.status, order.amount)}
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
          {order.status === 'pending' && order.amount > 0 && (
            <button
              onClick={handlePay}
              disabled={isPaying}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPaying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4" />
              )}
              Pay Now
            </button>
          )}
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
                  {order.amount === 0 ? 'Build free app' : 'Build Android'}
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
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 mb-4 text-sm">
            <div className="flex items-start gap-2 text-red-700 mb-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-semibold">Failed to trigger build</p>
                <p className="text-red-600 mt-1">Please try again or contact support if the issue persists.</p>
              </div>
            </div>
            <a
              href={`mailto:support@websitetoapp.app?subject=Build Trigger Failed - Order ${order.order_number}&body=Hi Support Team,%0D%0A%0D%0AI'm unable to trigger a build for my order.%0D%0A%0D%0AOrder Number: ${order.order_number}%0D%0A%0D%0APlease help me resolve this issue.%0D%0A%0D%0AThank you!`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Contact Support
            </a>
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
                      Building
                    </span>
                  )}
                </div>

                {build.status === 'building' && (
                  <p className="mt-2 text-xs text-gray-500">
                    Hang tight — this usually takes a few minutes. We'll email you when it's ready.
                  </p>
                )}

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
                    {build.keystore_url && (
                      <div className="w-full">
                        <a
                          href={build.keystore_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition text-sm font-medium"
                        >
                          <Download className="w-4 h-4" />
                          Download Keystore (.jks)
                        </a>
                        {(build.keystore_password || build.keystore_alias) && (
                          <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-1">
                            <p className="font-semibold text-amber-800 mb-1.5">Keystore Credentials</p>
                            {build.keystore_alias && (
                              <div className="flex items-center gap-2">
                                <span className="text-amber-700 w-24 shrink-0">Key Alias</span>
                                <code className="bg-white border border-amber-200 rounded px-2 py-0.5 font-mono text-amber-900 select-all">{build.keystore_alias}</code>
                              </div>
                            )}
                            {build.keystore_password && (
                              <div className="flex items-center gap-2">
                                <span className="text-amber-700 w-24 shrink-0">Password</span>
                                <code className="bg-white border border-amber-200 rounded px-2 py-0.5 font-mono text-amber-900 select-all">{build.keystore_password}</code>
                              </div>
                            )}
                            <p className="text-amber-600 pt-1">Keep these safe — required to update your app on Google Play.</p>
                          </div>
                        )}
                      </div>
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
                    <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm">
                      <div className="flex items-start gap-2 text-red-700">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-semibold text-red-800">Build Failed</p>
                          <p className="mt-1 text-red-700">
                            {build.error_message}
                          </p>
                          <div className="mt-3 pt-3 border-t border-red-200">
                            <p className="text-red-600 text-xs mb-2">Need help? Contact our support team:</p>
                            <a
                              href={`mailto:support@websitetoapp.app?subject=Build Failed - Order ${order.order_number}&body=Hi Support Team,%0D%0A%0D%0AMy build has failed with the following error:%0D%0A${encodeURIComponent(build.error_message)}%0D%0A%0D%0AOrder Number: ${order.order_number}%0D%0ABuild ID: ${build.id}%0D%0APlatform: ${build.platform}%0D%0A%0D%0APlease help me resolve this issue.%0D%0A%0D%0AThank you!`}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              Contact Support
                            </a>
                          </div>
                        </div>
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
