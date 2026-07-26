import { Link, useParams } from 'react-router-dom'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ordersApi, buildsApi, paymentsApi, subscriptionsApi } from '@/api/orders'
import { useNavigate } from 'react-router-dom'
import { createRazorpayOrder } from '@/api/razorpay-proxy'
import { formatCurrency, formatDateTime } from '@/utils/format'
import { Card, Badge, Skeleton, Button } from '@/components/ui'
import BuildPipeline from '@/components/BuildPipeline'
import SigningFingerprints from '@/components/SigningFingerprints'
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
  Mail,
} from 'lucide-react'

const statusTone: Record<string, 'amber' | 'green' | 'blue' | 'red' | 'gray'> = {
  pending: 'amber',
  paid: 'green',
  free: 'blue',
  failed: 'red',
  refunded: 'gray',
}

const orderLabel = (status: string, amount: number) =>
  status === 'paid' && amount === 0 ? 'free' : status

const buildTone: Record<string, 'amber' | 'green' | 'blue' | 'red'> = {
  pending: 'amber',
  building: 'blue',
  success: 'green',
  failed: 'red',
}

const buildStatusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="w-5 h-5 text-amber-600" />,
  building: <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />,
  success: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
  failed: <XCircle className="w-5 h-5 text-red-600" />,
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
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

  // ── Pro Monthly subscription (t80): 20 rebuilds/month for this app ──
  const [isSubscribing, setIsSubscribing] = useState(false)
  const { data: proPlan } = useQuery({
    queryKey: ['pro-plan'],
    queryFn: () => subscriptionsApi.proPlan().then((r) => r.data),
    retry: false,
  })
  const { data: activeSub } = useQuery({
    queryKey: ['active-subscription'],
    queryFn: () => subscriptionsApi.getActive().then((r) => r.data),
    retry: false,
  })

  const handleSubscribePro = async () => {
    if (!proPlan || !order) return
    setIsSubscribing(true)
    try {
      const res = await subscriptionsApi.create({
        plan_id: proPlan.id,
        app_config_id: order.app_config_id,
        currency: 'INR',
      })
      const sub = res.data
      const options = {
        key: sub.razorpay_key_id,
        subscription_id: sub.gateway_subscription_id,
        name: 'WebsiteToApp Pro Monthly',
        description: '20 rebuilds/month + priority builds for this app',
        handler: async () => {
          toast.success('Subscription started! It activates within a minute of payment.')
          queryClient.invalidateQueries({ queryKey: ['active-subscription'] })
          setIsSubscribing(false)
        },
        modal: { ondismiss: () => setIsSubscribing(false) },
      }
      const rzp = new (window as any).Razorpay(options)
      rzp.open()
    } catch (e: any) {
      toast.error(e?.response?.data?.detail ?? 'Could not start the subscription.')
      setIsSubscribing(false)
    }
  }

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
    ;(options as any).modal = {
      ondismiss: async () => {
        setIsPaying(false)
        // Backing out of payment leaves nothing behind: drop the pending
        // order (and its config if this was its only order).
        try {
          await ordersApi.remove(data.order_id)
          queryClient.invalidateQueries({ queryKey: ['orders'] })
          queryClient.invalidateQueries({ queryKey: ['apps'] })
          toast('Payment cancelled — nothing was saved.', { icon: 'ℹ️' })
          navigate('/apps')
        } catch { /* already paid or already gone */ }
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
      <div className="space-y-4 animate-fade-up">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (isError || !order) {
    return (
      <Card className="p-4 flex items-center gap-3 text-red-700 border-red-200">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <p className="text-sm">Failed to load order details. Please try again.</p>
      </Card>
    )
  }

  const latestBuild = builds && builds.length > 0 ? builds[0] : null

  return (
    <div className="animate-fade-up">
      {/* Back link */}
      <Link
        to="/orders"
        className="inline-flex items-center gap-1.5 text-sm text-soft hover:text-ink mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Orders
      </Link>

      {/* Order Header */}
      <Card className="p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-ink tracking-tight">
              Order <span className="font-mono">{order.order_number}</span>
            </h1>
            <p className="text-sm text-soft mt-1">
              Placed on {formatDateTime(order.created_at)}
            </p>
            {order.app_url && (
              <a
                href={order.app_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary-600 hover:underline mt-1 inline-block"
              >
                {order.app_url}
              </a>
            )}
          </div>
          <Badge tone={statusTone[orderLabel(order.status, order.amount)] ?? 'gray'} className="self-start !text-sm !px-3 !py-1">
            {orderLabel(order.status, order.amount)}
          </Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-[11px] text-soft uppercase tracking-wider font-semibold mb-1">Amount</p>
            <p className="text-lg font-semibold text-ink tabular-nums">
              {order.amount > 0 ? formatCurrency(order.amount, order.currency) : 'Free'}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-soft uppercase tracking-wider font-semibold mb-1">Plan</p>
            <p className="text-lg font-semibold text-ink">{order.plan_name ?? '-'}</p>
          </div>
          <div>
            <p className="text-[11px] text-soft uppercase tracking-wider font-semibold mb-1">App</p>
            <p className="text-lg font-semibold text-ink truncate">{order.app_name ?? '-'}</p>
          </div>
          <div>
            <p className="text-[11px] text-soft uppercase tracking-wider font-semibold mb-1">Payment</p>
            <p className="text-lg font-semibold text-ink">{order.payment_gateway ?? '-'}</p>
          </div>
        </div>
      </Card>

      {/* Pro Monthly upsell — paid apps only, hidden once a subscription is active */}
      {order.status === 'paid' && order.amount > 0 && proPlan && !activeSub && (
        <Card className="p-6 border-indigo-200 bg-indigo-50/50">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-base font-semibold text-ink">
                Pro Monthly — ${Math.round(proPlan.price_usd / 100)}/mo
              </h2>
              <p className="text-sm text-soft mt-1">
                Shipping updates often? Get <strong>20 rebuilds/month</strong> (instead of 5) and
                priority build queue for this app. Cancel anytime.
              </p>
            </div>
            <Button onClick={handleSubscribePro} disabled={isSubscribing}>
              {isSubscribing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
              Subscribe
            </Button>
          </div>
        </Card>
      )}

      {/* Build Status */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h2 className="text-base font-semibold text-ink flex items-center gap-2">
            <Hammer className="w-5 h-5 text-soft" />
            Build Status
          </h2>
          {order.status === 'pending' && order.amount > 0 && (
            <Button onClick={handlePay} disabled={isPaying}>
              {isPaying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4" />
              )}
              Pay Now
            </Button>
          )}
          {order.status === 'paid' && (
            <div className="flex items-center gap-2">
              {(!order.selected_platforms || order.selected_platforms.includes('android')) && (
                <Button
                  onClick={() => triggerBuild.mutate('android')}
                  disabled={
                    triggerBuild.isPending ||
                    (latestBuild !== null &&
                      (latestBuild.status === 'building' ||
                        latestBuild.status === 'pending'))
                  }
                >
                  {triggerBuild.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  {order.amount === 0 ? 'Build free app' : 'Build Android'}
                </Button>
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
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 mb-4 text-sm">
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
              <Mail className="w-4 h-4" />
              Contact Support
            </a>
          </div>
        )}

        {!builds || builds.length === 0 ? (
          <div className="text-center py-10">
            <Hammer className="w-10 h-10 mx-auto text-soft/40 mb-3" />
            <p className="text-soft">No builds yet.</p>
            {order.status === 'paid' && (
              <p className="text-sm text-soft/70 mt-1">
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
              <p className="text-sm text-soft/70 mt-1">
                Complete payment to start building your app.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {builds.map((build: Build, idx: number) => (
              <div key={build.id} className="border border-line rounded-xl p-4 bg-app/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {buildStatusIcons[build.status] ?? (
                      <Clock className="w-5 h-5 text-soft" />
                    )}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Badge tone={buildTone[build.status] ?? 'gray'}>{build.status}</Badge>
                        <Badge tone={build.platform === 'desktop' ? 'purple' : 'green'}>
                          {build.platform === 'desktop' ? 'Windows' : 'Android'}
                        </Badge>
                      </div>
                      <p className="text-xs text-soft mt-1">
                        {build.build_type} &middot; {formatDateTime(build.created_at)}
                      </p>
                    </div>
                  </div>
                  {idx === 0 && builds.length > 1 && (
                    <span className="text-[11px] font-semibold text-soft uppercase tracking-wide">Latest</span>
                  )}
                </div>

                {/* Stage pipeline for the most recent build (always) + any active build */}
                {(idx === 0 || build.status === 'building' || build.status === 'pending') && (
                  <div className="mb-3 pt-1">
                    <BuildPipeline status={build.status} progress={build.progress} />
                  </div>
                )}

                {build.status === 'building' && (
                  <p className="mt-2 text-xs text-soft">
                    Hang tight — this usually takes a few minutes. We'll email you when it's ready.
                  </p>
                )}

                {/* Download buttons on success */}
                {build.status === 'success' && (
                  <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-line">
                    {build.apk_url && (
                      <a
                        href={build.apk_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm font-medium"
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
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
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
                    {(build.apk_url || build.aab_url) && order.app_config_id && (
                      <SigningFingerprints appId={order.app_config_id} />
                    )}
                  </div>
                )}

                {/* Error message on failure */}
                {build.status === 'failed' && build.error_message && (
                  <div className="mt-3 pt-3 border-t border-line">
                    <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm">
                      <div className="flex items-start gap-2 text-red-700">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-semibold text-red-800">Build Failed</p>
                          <p className="mt-1 text-red-700">{build.error_message}</p>
                          <div className="mt-3 pt-3 border-t border-red-200">
                            <p className="text-red-600 text-xs mb-2">Need help? Contact our support team:</p>
                            <a
                              href={`mailto:support@websitetoapp.app?subject=Build Failed - Order ${order.order_number}&body=Hi Support Team,%0D%0A%0D%0AMy build has failed with the following error:%0D%0A${encodeURIComponent(build.error_message)}%0D%0A%0D%0AOrder Number: ${order.order_number}%0D%0ABuild ID: ${build.id}%0D%0APlatform: ${build.platform}%0D%0A%0D%0APlease help me resolve this issue.%0D%0A%0D%0AThank you!`}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                            >
                              <Mail className="w-4 h-4" />
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
                  <div className="mt-3 pt-3 border-t border-line flex gap-6 text-xs text-soft">
                    {build.started_at && (
                      <span>Started: {formatDateTime(build.started_at)}</span>
                    )}
                    {build.completed_at && (
                      <span>Completed: {formatDateTime(build.completed_at)}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
