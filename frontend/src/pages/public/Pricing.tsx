import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Check, X } from 'lucide-react'
import { plansApi } from '@/api/orders'
import { formatCurrency } from '@/utils/format'
import { clsx } from 'clsx'

const featureLabels: Record<string, string> = {
  twa: 'TWA Full-screen Mode',
  webview_fallback: 'WebView Fallback',
  custom_icon: 'Custom App Icon',
  custom_splash: 'Splash Screen',
  custom_colors: 'Custom Colors',
  push_notifications: 'Push Notifications',
  admob: 'AdMob Ads',
  biometric_auth: 'Biometric Auth',
  deep_linking: 'Deep Linking',
  offline_mode: 'Offline Mode',
  navigation_menu: 'Custom Navigation',
  firebase: 'Firebase Integration',
  qr_scanner: 'QR Scanner',
  js_bridge: 'JavaScript Bridge',
  screenshot_prevention: 'Screenshot Prevention',
  source_code: 'Source Code Access',
  aab_output: 'AAB for Play Store',
  pwa: 'PWA Generation',
  priority_support: 'Priority Support',
}

const FALLBACK_PLANS = [
  {
    id: '1', name: 'Free', slug: 'free', price_inr: 0, price_usd: 0,
    billing_type: 'one_time', max_apps: 1, sort_order: 0, is_active: true,
    description: 'Try WebToApp with basic features',
    features: { twa: true, webview_fallback: true, custom_icon: true, custom_splash: true, custom_colors: true, push_notifications: false, admob: false, biometric_auth: false, deep_linking: false, offline_mode: false, navigation_menu: false, firebase: false, qr_scanner: false, js_bridge: false, screenshot_prevention: false, source_code: false, aab_output: false, pwa: false, priority_support: false },
  },
  {
    id: '2', name: 'Basic', slug: 'basic', price_inr: 299900, price_usd: 3500,
    billing_type: 'one_time', max_apps: 3, sort_order: 1, is_active: true,
    description: 'Perfect for personal projects',
    features: { twa: true, webview_fallback: true, custom_icon: true, custom_splash: true, custom_colors: true, push_notifications: true, admob: true, biometric_auth: false, deep_linking: true, offline_mode: true, navigation_menu: true, firebase: true, qr_scanner: false, js_bridge: false, screenshot_prevention: false, source_code: false, aab_output: true, pwa: true, priority_support: false },
  },
  {
    id: '3', name: 'Pro', slug: 'pro', price_inr: 49900, price_usd: 999,
    billing_type: 'monthly', max_apps: 10, sort_order: 2, is_active: true,
    description: 'For professional developers',
    features: { twa: true, webview_fallback: true, custom_icon: true, custom_splash: true, custom_colors: true, push_notifications: true, admob: true, biometric_auth: true, deep_linking: true, offline_mode: true, navigation_menu: true, firebase: true, qr_scanner: true, js_bridge: true, screenshot_prevention: true, source_code: false, aab_output: true, pwa: true, priority_support: true },
  },
  {
    id: '4', name: 'Business', slug: 'business', price_inr: 99900, price_usd: 1999,
    billing_type: 'monthly', max_apps: 50, sort_order: 3, is_active: true,
    description: 'For agencies and enterprises',
    features: { twa: true, webview_fallback: true, custom_icon: true, custom_splash: true, custom_colors: true, push_notifications: true, admob: true, biometric_auth: true, deep_linking: true, offline_mode: true, navigation_menu: true, firebase: true, qr_scanner: true, js_bridge: true, screenshot_prevention: true, source_code: true, aab_output: true, pwa: true, priority_support: true },
  },
]

export default function Pricing() {
  const { data: plans } = useQuery({
    queryKey: ['plans'],
    queryFn: () => plansApi.list().then(r => r.data),
  })

  const displayPlans = plans && plans.length > 0 ? plans : FALLBACK_PLANS

  return (
    <div>
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-primary-100 text-lg">Choose the plan that fits your needs. Start free, upgrade anytime.</p>
        </div>
      </section>

      <section className="py-16 max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayPlans.map((plan) => (
            <div
              key={plan.slug}
              className={clsx(
                'border rounded-xl p-6 flex flex-col',
                plan.slug === 'pro' ? 'border-primary-500 ring-2 ring-primary-500 relative' : ''
              )}
            >
              {plan.slug === 'pro' && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                  Most Popular
                </span>
              )}
              <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
              <p className="text-gray-500 text-sm mb-4">{plan.description}</p>
              <div className="mb-4">
                <span className="text-3xl font-bold">{formatCurrency(plan.price_inr, 'INR')}</span>
                {plan.billing_type === 'monthly' && <span className="text-gray-700 text-sm font-semibold">/month</span>}
                {plan.billing_type === 'one_time' && plan.price_inr > 0 && <span className="text-green-700 text-sm font-semibold"> one-time</span>}
                <div className="text-xs text-gray-500 mt-0.5">
                  {formatCurrency(plan.price_usd, 'USD')}
                  {plan.billing_type === 'monthly' ? '/mo' : plan.price_usd > 0 ? ' one-time' : ''}
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-4">Up to {plan.max_apps} app{plan.max_apps > 1 ? 's' : ''}</p>
              <Link
                to="/register"
                className={clsx(
                  'block text-center py-2 rounded-lg font-medium mb-6',
                  plan.slug === 'pro'
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'border border-gray-300 hover:border-gray-400'
                )}
              >
                {plan.price_inr === 0 ? 'Start Free' : 'Get Started'}
              </Link>
              <ul className="space-y-2 flex-1">
                {Object.entries(featureLabels).map(([key, label]) => {
                  const enabled = (plan.features as Record<string, boolean>)[key]
                  return (
                  <li key={key} className="flex items-center gap-2 text-sm">
                    {enabled ? (
                      <Check className="w-4 h-4 text-green-500 shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-gray-300 shrink-0" />
                    )}
                    <span className={enabled ? '' : 'text-gray-400'}>{label}</span>
                  </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
