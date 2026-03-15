import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, ArrowRight } from 'lucide-react'
import { trackPurchase } from '@/utils/gtag'

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('order_id')

  // Fire Google Ads purchase conversion (Stripe flow)
  useEffect(() => {
    const pending = sessionStorage.getItem('pending_conversion')
    if (pending) {
      try {
        const { value, currency, orderId: storedOrderId } = JSON.parse(pending)
        trackPurchase(value, currency, orderId || storedOrderId)
      } catch { /* ignore parse errors */ }
      sessionStorage.removeItem('pending_conversion')
    }
  }, [])

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
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
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
