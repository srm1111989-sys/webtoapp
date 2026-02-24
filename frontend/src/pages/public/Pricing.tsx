import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Check, X } from 'lucide-react'
import { plansApi } from '@/api/orders'
import { formatPlanPrice, getUserCurrency } from '@/utils/format'
import { useSEO } from '@/hooks/useSEO'
import { clsx } from 'clsx'

const featureLabels: Record<string, string> = {
  twa: 'Full-screen App Mode',
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
  file_upload: 'File Upload',
  location_services: 'Location Services',
  camera_access: 'Camera Access',
  onboarding_screen: 'Onboarding Screen',
  app_shortcut: 'App Shortcuts',
  secondary_navigation: 'Secondary Navigation',
  social_login: 'Social Login',
  in_app_update: 'In-App Update',
  background_location: 'Background Location',
  facebook_app_events: 'Facebook Events',
  in_app_purchases: 'In-App Purchases',
  in_app_review: 'In-App Review',
  background_service: 'Background Service',
  native_contacts: 'Native Contacts',
  appsflyer: 'AppsFlyer Analytics',
  custom_media_player: 'Media Player',
  offer_card: 'Offer Card',
  intercom: 'Intercom Chat',
  dynamic_app_icon: 'Dynamic App Icon',
  bluetooth_connectivity: 'Bluetooth',
  download_file_manager: 'Download Manager',
  floating_action_menu: 'Floating Action Menu',
  revenue_cat: 'Revenue Cat',
  native_datastore: 'Native Datastore',
  passcode_lock: 'Passcode Lock',
  app_auto_launch: 'Auto Launch',
  advanced_bottom_navigation: 'Advanced Bottom Nav',
  firebase_notification: 'Firebase Notifications',
  tap_to_pay: 'Tap to Pay',
  aab_output: 'Play Store Bundle',
  pwa: 'Web App Support',
  priority_support: 'Priority Support',
}

const FALLBACK_PLANS = [
  {
    id: '1', name: 'Free', slug: 'free', price_inr: 0, price_usd: 0,
    billing_type: 'one_time', max_apps: 1, sort_order: 0, is_active: true,
    description: 'Try WebToApp with basic features',
    features: { twa: true, webview_fallback: true, custom_icon: true, custom_splash: true, custom_colors: true, push_notifications: false, admob: false, biometric_auth: false, deep_linking: false, offline_mode: false, navigation_menu: false, firebase: false, qr_scanner: false, js_bridge: false, screenshot_prevention: false, file_upload: false, location_services: false, camera_access: false, onboarding_screen: false, app_shortcut: false, secondary_navigation: false, social_login: false, in_app_update: false, background_location: false, facebook_app_events: false, in_app_purchases: false, in_app_review: false, background_service: false, native_contacts: false, appsflyer: false, custom_media_player: false, offer_card: false, intercom: false, dynamic_app_icon: false, bluetooth_connectivity: false, download_file_manager: false, floating_action_menu: false, revenue_cat: false, native_datastore: false, passcode_lock: false, app_auto_launch: false, advanced_bottom_navigation: false, firebase_notification: false, tap_to_pay: false, aab_output: false, pwa: false, priority_support: false },
  },
  {
    id: '3', name: 'Pro', slug: 'pro', price_inr: 49900, price_usd: 999,
    billing_type: 'monthly', max_apps: 10, sort_order: 1, is_active: true,
    description: 'For professional developers',
    features: { twa: true, webview_fallback: true, custom_icon: true, custom_splash: true, custom_colors: true, push_notifications: true, admob: true, biometric_auth: true, deep_linking: true, offline_mode: true, navigation_menu: true, firebase: true, qr_scanner: true, js_bridge: true, screenshot_prevention: true, file_upload: true, location_services: true, camera_access: true, onboarding_screen: true, app_shortcut: true, secondary_navigation: true, social_login: true, in_app_update: true, background_location: true, facebook_app_events: true, in_app_purchases: true, in_app_review: true, background_service: true, native_contacts: true, appsflyer: true, custom_media_player: true, offer_card: true, intercom: true, dynamic_app_icon: true, bluetooth_connectivity: true, download_file_manager: true, floating_action_menu: true, revenue_cat: true, native_datastore: true, passcode_lock: true, app_auto_launch: true, advanced_bottom_navigation: true, firebase_notification: true, tap_to_pay: true, aab_output: true, pwa: true, priority_support: true },
  },
  {
    id: '4', name: 'Business', slug: 'business', price_inr: 99900, price_usd: 1999,
    billing_type: 'monthly', max_apps: 50, sort_order: 2, is_active: true,
    description: 'For agencies and enterprises',
    features: { twa: true, webview_fallback: true, custom_icon: true, custom_splash: true, custom_colors: true, push_notifications: true, admob: true, biometric_auth: true, deep_linking: true, offline_mode: true, navigation_menu: true, firebase: true, qr_scanner: true, js_bridge: true, screenshot_prevention: true, file_upload: true, location_services: true, camera_access: true, onboarding_screen: true, app_shortcut: true, secondary_navigation: true, social_login: true, in_app_update: true, background_location: true, facebook_app_events: true, in_app_purchases: true, in_app_review: true, background_service: true, native_contacts: true, appsflyer: true, custom_media_player: true, offer_card: true, intercom: true, dynamic_app_icon: true, bluetooth_connectivity: true, download_file_manager: true, floating_action_menu: true, revenue_cat: true, native_datastore: true, passcode_lock: true, app_auto_launch: true, advanced_bottom_navigation: true, firebase_notification: true, tap_to_pay: true, aab_output: true, pwa: true, priority_support: true },
  },
  {
    id: '2', name: 'One Time', slug: 'one-time', price_inr: 299900, price_usd: 3500,
    billing_type: 'one_time', max_apps: 3, sort_order: 3, is_active: true,
    description: 'Pay once, use forever',
    features: { twa: true, webview_fallback: true, custom_icon: true, custom_splash: true, custom_colors: true, push_notifications: true, admob: true, biometric_auth: false, deep_linking: true, offline_mode: true, navigation_menu: true, firebase: true, qr_scanner: false, js_bridge: false, screenshot_prevention: false, file_upload: true, location_services: true, camera_access: true, onboarding_screen: true, app_shortcut: true, secondary_navigation: true, social_login: true, in_app_update: true, background_location: true, facebook_app_events: true, in_app_purchases: true, in_app_review: true, background_service: true, native_contacts: true, appsflyer: true, custom_media_player: true, offer_card: true, intercom: true, dynamic_app_icon: true, bluetooth_connectivity: true, download_file_manager: true, floating_action_menu: true, revenue_cat: true, native_datastore: true, passcode_lock: true, app_auto_launch: true, advanced_bottom_navigation: true, firebase_notification: true, tap_to_pay: true, aab_output: true, pwa: true, priority_support: false },
  },
]

export default function Pricing() {
  useSEO({
    title: 'Pricing - Affordable App Plans',
    description: 'Convert your website to an Android or Windows app starting free. Plans from $0 to $19.99/month with push notifications, AdMob, offline mode, and more.',
  })
  const { data: plans } = useQuery({
    queryKey: ['plans'],
    queryFn: () => plansApi.list().then(r => r.data),
  })

  const displayPlans = plans && plans.length > 0 ? plans : FALLBACK_PLANS

  return (
    <div>
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-10 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4">Simple, Transparent Pricing</h1>
          <p className="text-primary-100 text-base sm:text-lg">Choose the plan that fits your needs. Start free, upgrade anytime.</p>
        </div>
      </section>

      <section className="py-8 sm:py-16 max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {displayPlans.map((plan) => (
            <div
              key={plan.slug}
              className={clsx(
                'border rounded-xl p-4 sm:p-6 flex flex-col',
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
                <span className="text-3xl font-bold">{formatPlanPrice(plan.price_inr, plan.price_usd)}</span>
                {plan.billing_type === 'monthly' && <span className="text-gray-700 text-sm font-semibold"> per month</span>}
                {plan.billing_type === 'one_time' && (getUserCurrency() === 'INR' ? plan.price_inr : plan.price_usd) > 0 && <span className="text-green-700 text-sm font-semibold"> one-time</span>}
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
