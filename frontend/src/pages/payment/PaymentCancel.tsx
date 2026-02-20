import { Link, useSearchParams } from 'react-router-dom'
import { XCircle, ArrowRight, RotateCcw } from 'lucide-react'

export default function PaymentCancel() {
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('order_id')

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-6">
          <XCircle className="w-10 h-10 text-red-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Payment Cancelled
        </h1>
        <p className="text-gray-500 mb-8">
          Your payment was cancelled. No charges have been made. You can try
          again whenever you are ready.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {orderId ? (
            <Link
              to={`/orders/${orderId}`}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
            >
              <RotateCcw className="w-4 h-4" />
              Try Again
            </Link>
          ) : (
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
            >
              <RotateCcw className="w-4 h-4" />
              View Plans
            </Link>
          )}

          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
          >
            Go to Dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
