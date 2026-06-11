import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { GoogleLogin } from '@react-oauth/google'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function Login() {
  const navigate = useNavigate()
  const { setTokens, setUser } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [showResend, setShowResend] = useState(false)
  const [resendEmail, setResendEmail] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSent, setResendSent] = useState(false)

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    setLoginError('')
    setShowResend(false)
    try {
      const tokenRes = await authApi.login(data)
      setTokens(tokenRes.data.access_token, tokenRes.data.refresh_token)

      const userRes = await authApi.getMe()
      setUser(userRes.data)

      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err: any) {
      const status = err?.response?.status
      const message = err?.response?.data?.detail || 'Something went wrong. Please try again.'
      setLoginError(message)
      if (status === 403 && message.toLowerCase().includes('verify')) {
        setShowResend(true)
        setResendEmail(data.email)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResendLoading(true)
    try {
      await authApi.resendVerification(resendEmail)
      setResendSent(true)
    } catch {
      toast.error('Failed to resend. Please try again.')
    } finally {
      setResendLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) return
    setLoading(true)
    try {
      const tokenRes = await authApi.googleLogin(credentialResponse.credential)
      setTokens(tokenRes.data.access_token, tokenRes.data.refresh_token)

      const userRes = await authApi.getMe()
      setUser(userRes.data)

      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err: any) {
      const message = err?.response?.data?.detail || 'Google sign-in failed'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
        Sign in to your account
      </h2>

      {/* Google Sign-In */}
      <div className="flex justify-center mb-4">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => toast.error('Google sign-in failed')}
          size="large"
          width="100%"
          text="signin_with"
          shape="rectangular"
        />
      </div>

      <div className="relative mb-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-4 text-gray-500">or continue with email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register('email')}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent sm:text-sm"
            placeholder="you@example.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register('password')}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent sm:text-sm"
            placeholder="Enter your password"
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        <div className="flex items-center justify-end">
          <Link
            to="/forgot-password"
            className="text-sm font-medium text-primary-600 hover:text-primary-500"
          >
            Forgot your password?
          </Link>
        </div>

        {loginError && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
            <p className="text-sm text-red-700">{loginError}</p>
            {showResend && (
              <div className="mt-2">
                {resendSent ? (
                  <p className="text-sm text-green-700 font-medium">Verification email sent! Check your inbox.</p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendLoading}
                    className="text-sm font-medium text-primary-600 hover:text-primary-500 underline disabled:opacity-50"
                  >
                    {resendLoading ? 'Sending...' : 'Resend verification email'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
          Create one now
        </Link>
      </p>
    </div>
  )
}
