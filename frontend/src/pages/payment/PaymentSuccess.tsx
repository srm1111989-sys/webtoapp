import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react'
import { trackPurchase } from '@/utils/gtag'
import { paymentsApi } from '@/api/orders'

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('order_id')
  const gateway = searchParams.get('gateway')
  // PayPal appends ?token=<paypal_order_id>&PayerID=... to the return_url.
  const paypalOrderId = searchParams.get('token')
  const isPayPalReturn = gateway === 'paypal' && !!orderId && !!paypalOrderId

  // For the PayPal redirect flow the money is NOT captured until we call
  // /paypal/capture here — so this page must confirm before celebrating.
  const [capture, setCapture] = useState<'idle' | 'pending' | 'ok' | 'failed'>(
    isPayPalReturn ? 'pending' : 'idle'
  )
  const [captureError, setCaptureError] = useState<string | null>(null)

  useEffect(() => {
    if (!isPayPalReturn) return
    let cancelled = false
    paymentsApi
      .capturePayPal(orderId!, paypalOrderId!)
      .then(() => { if (!cancelled) setCapture('ok') })
      .catch((e) => {
        if (cancelled) return
        setCapture('failed')
        setCaptureError(e?.response?.data?.detail ?? 'We could not confirm the PayPal payment.')
      })
    return () => { cancelled = true }
  }, [isPayPalReturn, orderId, paypalOrderId])

  // Fire Google Ads purchase conversion once payment is confirmed
  // (immediately for Stripe/Razorpay redirects, after capture for PayPal).
  useEffect(() => {
    if (isPayPalReturn && capture !== 'ok') return
    const pending = sessionStorage.getItem('pending_conversion')
    if (pending) {
      try {
        const { value, currency, orderId: storedOrderId } = JSON.parse(pending)
        trackPurchase(value, currency, orderId || storedOrderId)
      } catch { /* ignore parse errors */ }
      sessionStorage.removeItem('pending_conversion')
    }
  }, [isPayPalReturn, capture, orderId])

  if (capture === 'pending') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <Loader2 className="mx-auto w-10 h-10 text-primary-600 animate-spin mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Confirming Payment…</h1>
          <p className="text-gray-500">
            We're confirming your PayPal payment. This takes just a moment — please
            don't close this page.
          </p>
        </div>
      </div>
    )
  }

  if (capture === 'failed') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-6">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Not Confirmed</h1>
          <p className="text-gray-500 mb-8">
            {captureError} If you were charged, contact support@websitetoapp.app with
            your order number and we'll sort it out right away.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {orderId && (
              <Link
                to={`/orders/${orderId}`}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
              >
                Back to Order
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Payment Successful
        </h1>
        <p className="text-gray-500 mb-8">
          Your payment has been processed successfully. We will start building
          your app shortly.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {orderId ? (
            <Link
              to={`/orders/${orderId}`}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
            >
              View Order Details
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              to="/orders"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
            >
              View Orders
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}

          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
