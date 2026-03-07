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

const ANDROID_FALLBACK = [
  {
    id: '1', name: 'Free', slug: 'android-free', price_inr: 0, price_usd: 0,
    billing_type: 'one_time', max_apps: 1, sort_order: 1, is_active: true, platform: 'android',
    description: 'Try with basic features',
    features: { twa: true, webview_fallback: true, custom_icon: true, custom_splash: true, custom_colors: true, fullscreen: true, orientation_lock: true, push_notifications: false, admob: false, biometric_auth: false, deep_linking: false, offline_mode: false, navigation_menu: false, firebase: false, qr_scanner: false, js_bridge: false, screenshot_prevention: false, file_upload: false, location_services: false, camera_access: false, onboarding_screen: false, app_shortcut: false, secondary_navigation: false, social_login: false, in_app_update: false, background_location: false, facebook_app_events: false, in_app_purchases: false, in_app_review: false, background_service: false, native_contacts: false, appsflyer: false, custom_media_player: false, offer_card: false, intercom: false, dynamic_app_icon: false, bluetooth_connectivity: false, download_file_manager: false, floating_action_menu: false, revenue_cat: false, native_datastore: false, passcode_lock: false, app_auto_launch: false, advanced_bottom_navigation: false, firebase_notification: false, tap_to_pay: false, aab_output: false, pwa: false, priority_support: false },
  },
  {
    id: '2', name: 'Paid', slug: 'android-paid', price_inr: 250000, price_usd: 3000,
    billing_type: 'one_time', max_apps: 1, sort_order: 2, is_active: true, platform: 'android',
    description: 'All features, one-time payment',
    features: { twa: true, webview_fallback: true, custom_icon: true, custom_splash: true, custom_colors: true, fullscreen: true, orientation_lock: true, push_notifications: true, admob: true, biometric_auth: true, deep_linking: true, offline_mode: true, navigation_menu: true, firebase: true, qr_scanner: true, js_bridge: true, screenshot_prevention: true, file_upload: true, location_services: true, camera_access: true, onboarding_screen: true, app_shortcut: true, secondary_navigation: true, social_login: true, in_app_update: true, background_location: true, facebook_app_events: true, in_app_purchases: true, in_app_review: true, background_service: true, native_contacts: true, appsflyer: true, custom_media_player: true, offer_card: true, intercom: true, dynamic_app_icon: true, bluetooth_connectivity: true, download_file_manager: true, floating_action_menu: true, revenue_cat: true, native_datastore: true, passcode_lock: true, app_auto_launch: true, advanced_bottom_navigation: true, firebase_notification: true, tap_to_pay: true, aab_output: true, pwa: true, priority_support: true },
  },
]

const DESKTOP_FALLBACK = [
  {
    id: '4', name: 'Free', slug: 'desktop-free', price_inr: 0, price_usd: 0,
    billing_type: 'one_time', max_apps: 1, sort_order: 4, is_active: true, platform: 'desktop',
    description: '15-day free trial',
    features: { custom_icon: true, custom_splash: true, custom_colors: true, fullscreen: true, watermark: true, trial_days: true, system_tray: false, custom_window_size: false, auto_updater: false, native_notifications: false, kiosk_mode: false },
  },
  {
    id: '5', name: 'Paid', slug: 'desktop-paid', price_inr: 200000, price_usd: 2400,
    billing_type: 'one_time', max_apps: 1, sort_order: 5, is_active: true, platform: 'desktop',
    description: 'Full desktop app, one-time',
    features: { custom_icon: true, custom_splash: true, custom_colors: true, fullscreen: true, watermark: false, trial_days: false, system_tray: true, custom_window_size: true, auto_updater: true, native_notifications: true, kiosk_mode: true, custom_title_bar: true, multi_window: true, tray_menu: true, startup_launch: true },
  },
]

const desktopFeatureLabels: Record<string, string> = {
  custom_icon: 'Custom App Icon',
  custom_splash: 'Splash Screen',
  custom_colors: 'Custom Colors',
  fullscreen: 'Fullscreen Mode',
  watermark: 'Watermark',
  trial_days: 'Trial Period',
  system_tray: 'System Tray',
  custom_window_size: 'Custom Window Size',
  auto_updater: 'Auto Updater',
  native_notifications: 'Native Notifications',
  kiosk_mode: 'Kiosk Mode',
  custom_title_bar: 'Custom Title Bar',
  multi_window: 'Multi Window',
  tray_menu: 'Tray Menu',
  startup_launch: 'Startup Launch',
}

export default function Pricing() {
  useSEO({
    title: 'Pricing - Simple One-Time Plans',
    description: 'Convert your website to an Android or Windows app. Simple one-time pricing, no subscriptions. Android from $0, Desktop from $0.',
  })
  const { data: plans } = useQuery({
    queryKey: ['plans'],
    queryFn: () => plansApi.list().then(r => r.data),
  })

  const androidPlans = plans && plans.length > 0
    ? (plans as any[]).filter((p) => p.platform === 'android')
    : ANDROID_FALLBACK
  const desktopPlans = plans && plans.length > 0
    ? (plans as any[]).filter((p) => p.platform === 'desktop')
    : DESKTOP_FALLBACK

  return (
    <div>
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-10 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4">Simple, One-Time Pricing</h1>
          <p className="text-primary-100 text-base sm:text-lg">No subscriptions. No monthly fees. Pay once for the plan you need.</p>
        </div>
      </section>

      {/* Android Plans */}
      <section className="py-8 sm:py-16 max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Android App Plans</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-12">
          {androidPlans.filter((p: any) => Object.keys(p.features).length > 0).map((plan: any) => (
            <div
              key={plan.slug}
              className={clsx(
                'border rounded-xl p-4 sm:p-6 flex flex-col',
                plan.slug === 'android-paid' ? 'border-primary-500 ring-2 ring-primary-500 relative' : ''
              )}
            >
              {plan.slug === 'android-paid' && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                  Best Value
                </span>
              )}
              <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
              <p className="text-gray-500 text-sm mb-4">{plan.description}</p>
              <div className="mb-4">
                <span className="text-3xl font-bold">{formatPlanPrice(plan.price_inr, plan.price_usd)}</span>
                {(getUserCurrency() === 'INR' ? plan.price_inr : plan.price_usd) > 0 && <span className="text-green-700 text-sm font-semibold"> one-time</span>}
              </div>
              <Link
                to="/register"
                className={clsx(
                  'block text-center py-2 rounded-lg font-medium mb-6',
                  plan.slug === 'android-paid'
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

      {/* Desktop Plans */}
      <section className="py-8 sm:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Desktop App Plans</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-2xl">
            {desktopPlans.map((plan: any) => (
              <div
                key={plan.slug}
                className={clsx(
                  'border rounded-xl p-4 sm:p-6 flex flex-col bg-white',
                  plan.slug === 'desktop-paid' ? 'border-primary-500 ring-2 ring-primary-500 relative' : ''
                )}
              >
                {plan.slug === 'desktop-paid' && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                    Best Value
                  </span>
                )}
                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                <p className="text-gray-500 text-sm mb-4">{plan.description}</p>
                <div className="mb-4">
                  <span className="text-3xl font-bold">{formatPlanPrice(plan.price_inr, plan.price_usd)}</span>
                  {(getUserCurrency() === 'INR' ? plan.price_inr : plan.price_usd) > 0 && <span className="text-green-700 text-sm font-semibold"> one-time</span>}
                </div>
                <Link
                  to="/register"
                  className={clsx(
                    'block text-center py-2 rounded-lg font-medium mb-6',
                    plan.slug === 'desktop-paid'
                      ? 'bg-primary-600 text-white hover:bg-primary-700'
                      : 'border border-gray-300 hover:border-gray-400'
                  )}
                >
                  {plan.price_inr === 0 ? 'Start Free Trial' : 'Get Started'}
                </Link>
                <ul className="space-y-2 flex-1">
                  {Object.entries(desktopFeatureLabels).map(([key, label]) => {
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
        </div>
      </section>
    </div>
  )
}
