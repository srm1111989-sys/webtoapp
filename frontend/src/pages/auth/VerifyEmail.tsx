import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, AlertCircle, Loader2, Mail } from 'lucide-react'
import { authApi } from '@/api/auth'

type Status = 'verifying' | 'success' | 'error'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<Status>('verifying')
  const [errorMsg, setErrorMsg] = useState('')
  const [resendEmail, setResendEmail] = useState('')
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setErrorMsg('Verification link is missing. Please use the link from your email.')
      return
    }

    let cancelled = false
    authApi
      .verifyEmail(token)
      .then(() => {
        if (!cancelled) setStatus('success')
      })
      .catch((err: any) => {
        if (cancelled) return
        setStatus('error')
        setErrorMsg(
          err?.response?.data?.detail ||
            'This verification link is invalid or has expired.'
        )
      })

    return () => {
      cancelled = true
    }
  }, [token])

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resendEmail) return
    setResending(true)
    try {
      await authApi.resendVerification(resendEmail)
      setResent(true)
    } catch {
      setResent(true)
    } finally {
      setResending(false)
    }
  }

  if (status === 'verifying') {
    return (
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 text-primary-600 animate-spin mb-3" />
        <h2 className="text-lg font-semibold text-gray-900">Verifying your email…</h2>
        <p className="text-sm text-gray-500 mt-1">Hang tight, this only takes a second.</p>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-50 mb-4">
          <CheckCircle2 className="h-6 w-6 text-green-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Email verified</h2>
        <p className="text-sm text-gray-600 mb-6">
          Your email has been confirmed. You can now sign in to your account.
        </p>
        <Link
          to="/login"
          className="inline-flex justify-center py-2 px-4 rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors"
        >
          Sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="text-center">
      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-50 mb-4">
        <AlertCircle className="h-6 w-6 text-red-600" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Verification failed</h2>
      <p className="text-sm text-gray-600 mb-5">{errorMsg}</p>

      {resent ? (
        <div className="rounded-md bg-green-50 border border-green-200 px-3 py-2.5 text-sm text-green-700 inline-flex items-center gap-2">
          <Mail className="h-4 w-4" />
          If an unverified account exists for that email, a new link is on its way.
        </div>
      ) : (
        <form onSubmit={handleResend} className="space-y-3 max-w-sm mx-auto text-left">
          <label htmlFor="resend-email" className="block text-xs font-medium text-gray-700">
            Resend verification email
          </label>
          <div className="flex gap-2">
            <input
              id="resend-email"
              type="email"
              required
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
              placeholder="you@example.com"
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={resending}
              className="px-3 py-2 rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {resending ? 'Sending…' : 'Resend'}
            </button>
          </div>
        </form>
      )}

      <p className="mt-6 text-sm text-gray-500">
        <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
          Back to sign in
        </Link>
      </p>
    </div>
  )
}
