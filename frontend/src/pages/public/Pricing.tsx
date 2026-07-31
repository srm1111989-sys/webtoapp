import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Check, X, TrendingDown, Shield, Zap, IndianRupee, DollarSign, Store } from 'lucide-react'
import { plansApi } from '@/api/orders'
import { formatPlanPrice, getUserCurrency } from '@/utils/format'
import { useSEO } from '@/hooks/useSEO'
import { trackViewPricing } from '@/utils/gtag'
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
    billing_type: 'one_time', max_apps: 5, sort_order: 1, is_active: true, platform: 'android',
    description: '5 free builds total across your websites, watermark & 15-day trial',
    features: { twa: true, webview_fallback: true, custom_icon: true, custom_splash: true, custom_colors: true, fullscreen: true, orientation_lock: true, push_notifications: true, admob: true, biometric_auth: true, deep_linking: true, offline_mode: true, navigation_menu: true, firebase: true, qr_scanner: true, js_bridge: true, screenshot_prevention: true, file_upload: true, location_services: true, camera_access: true, onboarding_screen: true, app_shortcut: true, secondary_navigation: true, social_login: true, in_app_update: true, background_location: true, facebook_app_events: true, in_app_purchases: true, in_app_review: true, background_service: true, native_contacts: true, appsflyer: true, custom_media_player: true, offer_card: true, intercom: true, dynamic_app_icon: true, bluetooth_connectivity: true, download_file_manager: true, floating_action_menu: true, revenue_cat: true, native_datastore: true, passcode_lock: true, app_auto_launch: true, advanced_bottom_navigation: true, firebase_notification: true, tap_to_pay: true, aab_output: true, pwa: true, priority_support: false },
  },
  {
    id: '2', name: 'Paid', slug: 'android-paid', price_inr: 290500, price_usd: 3500,
    billing_type: 'one_time', max_apps: 1, sort_order: 2, is_active: true, platform: 'android',
    description: 'All features, one-time payment',
    features: { twa: true, webview_fallback: true, custom_icon: true, custom_splash: true, custom_colors: true, fullscreen: true, orientation_lock: true, push_notifications: true, admob: true, biometric_auth: true, deep_linking: true, offline_mode: true, navigation_menu: true, firebase: true, qr_scanner: true, js_bridge: true, screenshot_prevention: true, file_upload: true, location_services: true, camera_access: true, onboarding_screen: true, app_shortcut: true, secondary_navigation: true, social_login: true, in_app_update: true, background_location: true, facebook_app_events: true, in_app_purchases: true, in_app_review: true, background_service: true, native_contacts: true, appsflyer: true, custom_media_player: true, offer_card: true, intercom: true, dynamic_app_icon: true, bluetooth_connectivity: true, download_file_manager: true, floating_action_menu: true, revenue_cat: true, native_datastore: true, passcode_lock: true, app_auto_launch: true, advanced_bottom_navigation: true, firebase_notification: true, tap_to_pay: true, aab_output: true, pwa: true, priority_support: true },
  },
  {
    id: '3', name: 'Play Store Listing', slug: 'play-store-listing', price_inr: 124500, price_usd: 1500,
    billing_type: 'one_time', max_apps: 1, sort_order: 3, is_active: true, platform: 'android',
    description: 'We publish your app to Google Play Store on your behalf',
    features: { play_store_listing: true },
  },
  {
    id: '10', name: 'App + Play Store', slug: 'android-both', price_inr: 415000, price_usd: 5000,
    billing_type: 'one_time', max_apps: 1, sort_order: 4, is_active: true, platform: 'android',
    description: 'App build + Play Store Listing bundle',
    features: { twa: true, webview_fallback: true, custom_icon: true, custom_splash: true, custom_colors: true, fullscreen: true, orientation_lock: true, push_notifications: true, admob: true, biometric_auth: true, deep_linking: true, offline_mode: true, navigation_menu: true, firebase: true, qr_scanner: true, js_bridge: true, screenshot_prevention: true, file_upload: true, location_services: true, camera_access: true, onboarding_screen: true, app_shortcut: true, secondary_navigation: true, social_login: true, in_app_update: true, background_location: true, facebook_app_events: true, in_app_purchases: true, in_app_review: true, background_service: true, native_contacts: true, appsflyer: true, custom_media_player: true, offer_card: true, intercom: true, dynamic_app_icon: true, bluetooth_connectivity: true, download_file_manager: true, floating_action_menu: true, revenue_cat: true, native_datastore: true, passcode_lock: true, app_auto_launch: true, advanced_bottom_navigation: true, firebase_notification: true, tap_to_pay: true, aab_output: true, pwa: true, priority_support: true, play_store_listing: true },
  },
]

const DESKTOP_FALLBACK = [
  {
    id: '4', name: 'Free', slug: 'desktop-free', price_inr: 0, price_usd: 0,
    billing_type: 'one_time', max_apps: 5, sort_order: 4, is_active: true, platform: 'desktop',
    description: '5 free builds total across your websites, watermark & 15-day trial',
    features: { custom_icon: true, custom_splash: true, custom_colors: true, fullscreen: true, watermark: true, trial_days: true, system_tray: true, custom_window_size: true, auto_updater: true, native_notifications: true, kiosk_mode: true },
  },
  {
    id: '5', name: 'Paid', slug: 'desktop-paid', price_inr: 290500, price_usd: 3500,
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

// Plain-text pricing answers (t147 GEO): every fact below comes from the plans
// rendered on this page and /refund-policy — keep them in sync when prices change.
const PRICING_FAQS = [
  {
    question: 'How much does it cost to convert a website to an app?',
    answer:
      'With WebsiteToApp, converting a website to an Android app costs $35 one-time (no subscription). A Windows desktop app (.exe) is also $35 one-time, and an iOS app (beta) is $35 one-time. There is a free plan with 5 builds (watermarked, 15-day trial) so you can test everything before paying. If you also want us to publish your app to Google Play, the App + Play Store bundle is $50 one-time, or the Play Store listing service alone is $15 one-time.',
  },
  {
    question: 'Is there a free plan, and does it have a watermark?',
    answer:
      'Yes. The free plan includes 5 free builds total across your websites with all app features enabled for testing. Free builds show a WebsiteToApp watermark and run as a 15-day trial (an upgrade screen appears after). The $35 one-time paid plan removes the watermark and the trial limit permanently.',
  },
  {
    question: 'How many rebuilds do I get when my website changes?',
    answer:
      'Paid apps include 5 rebuilds per month per website. If you ship updates often, the optional Pro Monthly add-on ($9/month per app) raises this to 20 rebuilds per month and adds a priority build queue — cancel anytime. Note: your app loads your live website, so content changes appear without any rebuild; rebuilds are only needed for app-level changes like icon, name, or features.',
  },
  {
    question: 'Is the pricing monthly or one-time?',
    answer:
      'App builds are one-time payments: $35 for Android, $35 for Windows desktop (.exe), $35 for iOS (beta), $50 for the App + Play Store bundle. There are no recurring fees to keep your app working. The only monthly product is the optional $9/month Pro Monthly rebuild add-on.',
  },
  {
    question: 'Can I get a refund?',
    answer:
      'Yes — one-time purchases have a full refund within 7 days of purchase if the app build has not been downloaded, and a full refund if a build fails due to a platform issue. Pro Monthly subscriptions can be refunded in full within 48 hours of first subscribing if no builds were triggered. See the refund policy page for the complete terms.',
  },
]

export default function Pricing() {
  useSEO({
    title: 'Pricing - Simple One-Time Plans',
    description: 'Convert your website to an Android or Windows app. Simple one-time pricing, no subscriptions. Android from $0, Desktop from $0.',
    canonical: 'https://websitetoapp.app/pricing',
  })
  trackViewPricing()
  const { data: plans } = useQuery({
    queryKey: ['plans'],
    queryFn: () => plansApi.list().then(r => r.data),
  })

  const allAndroidPlans = plans && plans.length > 0
    ? (plans as any[]).filter((p) => p.platform === 'android')
    : ANDROID_FALLBACK
  const allDesktopPlans = plans && plans.length > 0
    ? (plans as any[]).filter((p) => p.platform === 'desktop')
    : DESKTOP_FALLBACK

  const androidFreePlan = allAndroidPlans.find((p: any) => p.slug === 'android-free')
  const androidPaidPlan = allAndroidPlans.find((p: any) => p.slug === 'android-paid')
  const androidBothPlan = allAndroidPlans.find((p: any) => p.slug === 'android-both')
  const playStoreListingPlan = allAndroidPlans.find((p: any) => p.slug === 'play-store-listing')
  const desktopFreePlan = allDesktopPlans.find((p: any) => p.price_inr === 0)
  const desktopPaidPlan = allDesktopPlans.find((p: any) => p.price_inr > 0)
  const iosBetaPlan = plans && (plans as any[]).find((p: any) => p.slug === 'ios-beta')

  const pricingFaqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: PRICING_FAQS.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  }

  return (
    <div>
      {/* Pricing FAQ Schema (t147 GEO) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingFaqSchema) }}
      />
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-10 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4">Simple, One-Time Pricing</h1>
          {/* Answer-first opening (t147 GEO): plain-text cost answer before anything else */}
          <p className="text-white/95 text-base sm:text-lg max-w-3xl mx-auto mb-3 text-left sm:text-center">
            How much does it cost to convert a website to an app? With WebsiteToApp it's{' '}
            <strong>$35 one-time</strong> for an Android app, <strong>$35 one-time</strong> for a Windows
            desktop app (.exe), and <strong>$50 one-time</strong> for the App + Play Store publishing
            bundle — no subscriptions. A free plan (5 builds, watermarked, 15-day trial) lets you test
            everything first.
          </p>
          <p className="text-primary-100 text-base sm:text-lg">Start free, upgrade when you're ready. No subscriptions.</p>
        </div>
      </section>

      {/* Android Plans */}
      <section className="py-8 sm:py-16 max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Android App Plans</h2>
        <p className="text-center text-gray-500 text-sm -mt-4 mb-8">
          Want the full breakdown of what's free vs. paid? Read our{' '}
          <Link to="/blog/website-to-app-converter-free" className="text-primary-600 hover:underline font-medium">
            website to app converter free guide
          </Link>.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
          {/* Android Free Plan */}
          {androidFreePlan && (
            <div className="border-2 border-gray-200 rounded-xl p-4 sm:p-6 flex flex-col bg-white">
              <h3 className="text-xl font-bold mb-1">Free Plan</h3>
              <p className="text-gray-500 text-sm mb-4">Try before you buy - 5 free builds total across your websites</p>
              <div className="mb-4">
                <span className="text-3xl font-bold">Free</span>
                <span className="text-gray-500 text-sm ml-1">forever</span>
              </div>
              <Link
                to="/register"
                className="block text-center py-2 rounded-lg font-medium mb-6 bg-gray-100 text-gray-800 hover:bg-gray-200"
              >
                Get Started Free
              </Link>
              <ul className="space-y-2 flex-1">
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 shrink-0" />
                  <span><strong>5 free builds</strong> total across your websites</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 shrink-0" />
                  <span>All app features included (for testing)</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-amber-600">
                  <X className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>WebsiteToApp watermark shown</span>
                </li>
                <li className="flex items-center gap-2 text-amber-600">
                  <X className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="text-base font-bold">15-Day Free Trial</span>
                  <span className="text-xs">(upgrade screen after)</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <X className="w-4 h-4 text-gray-300 shrink-0" />
                  <span className="text-gray-400">No keystore download</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <X className="w-4 h-4 text-gray-300 shrink-0" />
                  <span className="text-gray-400">No advanced features</span>
                </li>
              </ul>
            </div>
          )}

          {/* Android Paid Plan */}
          {androidPaidPlan && (
            <div className="border border-primary-500 ring-2 ring-primary-500 relative rounded-xl p-4 sm:p-6 flex flex-col bg-white">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                Recommended
              </span>
              <h3 className="text-xl font-bold mb-1">Premium Plan</h3>
              <p className="text-gray-500 text-sm mb-4">{androidPaidPlan.description}</p>
              <div className="mb-4">
                <span className="text-3xl font-bold">{formatPlanPrice(androidPaidPlan.price_inr, androidPaidPlan.price_usd)}</span>
                <span className="text-green-700 text-sm font-semibold"> one-time</span>
              </div>
              <Link
                to="/register"
                className="block text-center py-2 rounded-lg font-medium mb-6 bg-primary-600 text-white hover:bg-primary-700"
              >
                Get Started
              </Link>
              <ul className="space-y-2 flex-1">
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 shrink-0" />
                  <span><strong>5 free builds/month</strong> per website</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 shrink-0" />
                  <span>No watermark</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 shrink-0" />
                  <span>No trial limit - works forever</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 shrink-0" />
                  <span>Keystore download</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 shrink-0" />
                  <span>All 50+ features</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 shrink-0" />
                  <span>Priority support</span>
                </li>
              </ul>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 font-medium mb-2">All features included:</p>
                <div className="grid grid-cols-2 gap-1">
                  {Object.entries(featureLabels).map(([key, label]) => {
                    const enabled = (androidPaidPlan.features as Record<string, boolean>)[key]
                    return enabled ? (
                      <span key={key} className="text-xs text-gray-600 flex items-center gap-1">
                        <Check className="w-3 h-3 text-green-500 shrink-0" />
                        {label}
                      </span>
                    ) : null
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Android Both Plan */}
          {androidBothPlan && (
            <div className="border border-indigo-500 ring-2 ring-indigo-500 relative rounded-xl p-4 sm:p-6 flex flex-col bg-white">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap">
                App + Publishing
              </span>
              <h3 className="text-xl font-bold mb-1">Bundle Plan</h3>
              <p className="text-gray-500 text-sm mb-4">{androidBothPlan.description}</p>
              <div className="mb-4">
                <span className="text-3xl font-bold">{formatPlanPrice(androidBothPlan.price_inr, androidBothPlan.price_usd)}</span>
                <span className="text-green-700 text-sm font-semibold"> one-time</span>
              </div>
              <Link
                to="/register"
                className="block text-center py-2 rounded-lg font-medium mb-6 bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Get Started
              </Link>
              <ul className="space-y-2 flex-1">
                <li className="flex items-center gap-2 text-sm font-semibold text-indigo-700 bg-indigo-50 rounded-lg px-2 py-1.5 mt-1">
                  <Check className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>App Build + Play Store Listing</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 shrink-0" />
                  <span><strong>5 free builds/month</strong> per website</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 shrink-0" />
                  <span>No watermark</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 shrink-0" />
                  <span>No trial limit - works forever</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 shrink-0" />
                  <span>All 50+ features included</span>
                </li>
              </ul>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 font-medium mb-2">Everything in Premium, plus publishing.</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Add-on Services */}
      {playStoreListingPlan && (
        <section className="py-8 sm:py-12 max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Add-on Services</h2>
          <p className="text-gray-500 text-center mb-8 text-sm">Professional services to get your app live on app stores</p>
          <div className="max-w-sm mx-auto">
            <div className="border-2 border-indigo-200 rounded-xl p-4 sm:p-6 flex flex-col bg-white">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl bg-indigo-100">
                  <Store className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold">Play Store Listing</h3>
              </div>
              <p className="text-gray-500 text-sm mb-4">{playStoreListingPlan.description}</p>
              <div className="mb-4">
                <span className="text-3xl font-bold">{formatPlanPrice(playStoreListingPlan.price_inr, playStoreListingPlan.price_usd)}</span>
                <span className="text-green-700 text-sm font-semibold"> one-time</span>
              </div>
              <Link
                to="/register"
                className="block text-center py-2 rounded-lg font-medium mb-6 bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Get Started
              </Link>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 shrink-0" />
                  <span>We create & submit the Play Store listing</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 shrink-0" />
                  <span>App title, description & screenshots</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 shrink-0" />
                  <span>Category, content rating & store details</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 shrink-0" />
                  <span>Keystore signing & AAB upload</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-400">
                  <X className="w-4 h-4 shrink-0" />
                  <span>Requires Android Premium plan (app build)</span>
                </li>
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Desktop Plans */}
      <section className="py-8 sm:py-16 max-w-7xl mx-auto px-4 bg-gray-50">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Desktop App Plans</h2>
        <p className="text-center text-gray-500 text-sm mb-8">
          Want to turn your website into a Windows .exe? See our{' '}
          <Link to="/convert/website-to-exe" className="text-primary-600 hover:underline font-medium">
            free website to EXE converter
          </Link>{' '}
          guide.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
          {/* Desktop Free Plan */}
          {desktopFreePlan && (
            <div className="border-2 border-gray-200 rounded-xl p-4 sm:p-6 flex flex-col bg-white">
              <h3 className="text-xl font-bold mb-1">Free Plan</h3>
              <p className="text-gray-500 text-sm mb-4">15-day free trial with all features</p>
              <div className="mb-4">
                <span className="text-3xl font-bold">Free</span>
                <span className="text-gray-500 text-sm ml-1">15-day trial</span>
              </div>
              <Link
                to="/register"
                className="block text-center py-2 rounded-lg font-medium mb-6 bg-gray-100 text-gray-800 hover:bg-gray-200"
              >
                Start Free Trial
              </Link>
              <ul className="space-y-2 flex-1">
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 shrink-0" />
                  <span><strong>5 free builds</strong> total across your websites</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 shrink-0" />
                  <span>Basic customization</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-amber-600">
                  <X className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>WebsiteToApp watermark</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-amber-600">
                  <X className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>15-day trial (shows upgrade screen after)</span>
                </li>
              </ul>
            </div>
          )}

          {/* Desktop Paid Plan */}
          {desktopPaidPlan && (
            <div className="border border-primary-500 ring-2 ring-primary-500 relative rounded-xl p-4 sm:p-6 flex flex-col bg-white">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                Best Value
              </span>
              <h3 className="text-xl font-bold mb-1">Premium Plan</h3>
              <p className="text-gray-500 text-sm mb-4">{desktopPaidPlan.description}</p>
              <div className="mb-4">
                <span className="text-3xl font-bold">{formatPlanPrice(desktopPaidPlan.price_inr, desktopPaidPlan.price_usd)}</span>
                <span className="text-green-700 text-sm font-semibold"> one-time</span>
              </div>
              <Link
                to="/register"
                className="block text-center py-2 rounded-lg font-medium mb-6 bg-primary-600 text-white hover:bg-primary-700"
              >
                Get Started
              </Link>
              <ul className="space-y-2 flex-1">
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 shrink-0" />
                  <span><strong>5 free builds/month</strong> per website</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 shrink-0" />
                  <span>No watermark</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 shrink-0" />
                  <span>No trial limit - works forever</span>
                </li>
                {Object.entries(desktopFeatureLabels).map(([key, label]) => {
                  const enabled = (desktopPaidPlan.features as Record<string, boolean>)[key]
                  if (key === 'watermark' || key === 'trial_days') return null
                  return enabled ? (
                    <li key={key} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 shrink-0" />
                      <span>{label}</span>
                    </li>
                  ) : null
                })}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* Pro Monthly add-on (t80) — subscribed from a paid app's order page */}
      <section className="py-8 max-w-7xl mx-auto px-4">
        <div className="max-w-3xl mx-auto border-2 border-indigo-200 bg-indigo-50/60 rounded-xl p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Pro Monthly <span className="text-indigo-600">— $9/mo per app</span></h2>
              <p className="text-sm text-gray-600 mt-2 max-w-xl">
                An optional add-on for <strong>paid apps that ship updates often</strong>: get{' '}
                <strong>20 rebuilds per month</strong> (instead of 5) and priority build queue.
                Cancel anytime. Subscribe from your app's order page in the dashboard after purchase.
              </p>
            </div>
            <Link to="/apps" className="shrink-0 py-2 px-5 rounded-lg font-medium bg-indigo-600 text-white hover:bg-indigo-700">
              Go to My Apps
            </Link>
          </div>
        </div>
      </section>

      {/* iOS Plan (Beta) */}
      <section className="py-8 sm:py-16 max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <h2 className="text-2xl font-bold text-gray-900">iOS App</h2>
          <span className="text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-0.5">BETA</span>
        </div>
        <p className="text-center text-gray-500 text-sm mb-8 max-w-2xl mx-auto">
          Build and test your iOS app for <strong>free</strong> (5 free builds total across your websites, all
          features, watermark &amp; 15-day trial). When you're ready, upgrade to get the unsigned build plus the
          full Xcode source — <strong>you publish it yourself with your own Apple Developer account</strong>.
          Same price as Android. We do not offer App Store publishing support.
        </p>
        <div className="max-w-md mx-auto">
          <div className="border-2 border-gray-200 rounded-xl p-6 flex flex-col bg-white">
            <h3 className="text-xl font-bold mb-1">iOS App</h3>
            <p className="text-gray-500 text-sm mb-4">Unsigned IPA + complete Xcode source project</p>
            <div className="mb-4">
              <span className="text-3xl font-bold">
                {iosBetaPlan
                  ? formatPlanPrice(iosBetaPlan.price_inr, iosBetaPlan.price_usd)
                  : formatPlanPrice(290500, 3500)}
              </span>
              <span className="text-gray-500 text-sm ml-1">one-time</span>
            </div>
            <Link to="/register" className="block text-center py-2 rounded-lg font-medium mb-6 bg-primary-600 text-white hover:bg-primary-700">
              Get Started
            </Link>
            <ul className="space-y-2 flex-1">
              {[
                'Native WKWebView iOS app from your website',
                'Unsigned .ipa — test in the iOS simulator / Xcode',
                'Full Xcode source project included',
                'Your icon, colors and splash',
              ].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
              <li className="flex items-start gap-2 text-sm text-amber-600">
                <X className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>You sign &amp; publish with your own Apple account — no publishing support</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Price Comparison with Industry */}
      <section className="py-10 sm:py-20 max-w-7xl mx-auto px-4">
        <div className="text-center mb-10 sm:mb-14">
          <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            <TrendingDown className="w-4 h-4" />
            Save up to 95%
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">How We Compare</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Most web-to-app services charge recurring fees or expensive one-time prices.
            See how much you save with WebsiteToApp.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="max-w-4xl mx-auto overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left py-4 px-4 sm:px-6 text-sm font-semibold text-gray-500 border-b-2 border-gray-100">Feature</th>
                <th className="py-4 px-4 sm:px-6 text-sm font-semibold text-gray-400 border-b-2 border-gray-100 text-center">GoNative</th>
                <th className="py-4 px-4 sm:px-6 text-sm font-semibold text-gray-400 border-b-2 border-gray-100 text-center">WebIntoApp</th>
                <th className="py-4 px-4 sm:px-6 text-sm font-semibold text-gray-400 border-b-2 border-gray-100 text-center">AppMySite</th>
                <th className="py-4 px-4 sm:px-6 text-sm font-semibold border-b-2 border-primary-200 text-center bg-primary-50 rounded-t-xl text-primary-700">WebsiteToApp ✓</th>
              </tr>
            </thead>
            <tbody>
              {[
                { feature: 'Android App Price', a: '$99–$299/mo', b: 'Free (branded) or $89+ once', c: '$39–$99/mo', us: '$35 one-time', highlight: true },
                { feature: 'Desktop App Price', a: 'Not available', b: 'Not available', c: 'Not available', us: '$35 one-time', highlight: true },
                { feature: '15-Day Free Trial', a: '✗', b: '✗', c: 'Limited', us: '✓ 15 Days', highlight: false },
                { feature: 'Pricing Model', a: 'Monthly/Yearly', b: 'Free (branded) or one-time', c: 'Monthly sub', us: 'One-time only', highlight: false },
                { feature: 'Push Notifications', a: 'Included', b: 'Paid tier only', c: 'Add-on ($)', us: '✓ Included', highlight: false },
                { feature: 'AdMob Integration', a: '✗', b: '✗', c: '✗', us: '✓ Included', highlight: false },
                { feature: 'Windows Desktop App', a: '✗', b: '✗', c: '✗', us: '✓ Included', highlight: false },
                { feature: 'QR Scanner', a: 'Plugin needed', b: 'Extra', c: '✗', us: '✓ Included', highlight: false },
                { feature: 'Biometric Auth', a: 'JS Bridge only', b: '✗', c: '✗', us: '✓ No-code', highlight: false },
                { feature: 'Firebase Integration', a: 'Extra', b: '✗', c: 'Extra', us: '✓ Included', highlight: false },
                { feature: 'Total Features', a: '~20', b: '~15', c: '~18', us: '50+', highlight: false },
                { feature: 'Builds Per Month', a: '5–unlimited', b: '3–10', c: '5–20', us: '2 (free) / 5/mo', highlight: false },
                { feature: 'Annual Cost (entry)', a: '$1,188+', b: '$89 to unbrand', c: '$468+', us: '$35 one-time', highlight: true },
                { feature: 'No-code Setup', a: 'Dev skills needed', b: '✓', c: '✓', us: '✓ Wizard', highlight: false },
                { feature: 'Support', a: 'Email', b: 'Email', c: 'Email', us: '✓ WhatsApp + Email', highlight: false },
              ].map((row, idx) => (
                <tr key={idx} className={row.highlight ? 'bg-gray-50' : ''}>
                  <td className="py-3 px-4 sm:px-6 text-sm font-medium text-gray-900 border-b border-gray-100">
                    {row.feature}
                  </td>
                  <td className="py-3 px-4 sm:px-6 text-sm text-gray-500 text-center border-b border-gray-100">
                    {row.a}
                  </td>
                  <td className="py-3 px-4 sm:px-6 text-sm text-gray-500 text-center border-b border-gray-100">
                    {row.b}
                  </td>
                  <td className="py-3 px-4 sm:px-6 text-sm text-gray-500 text-center border-b border-gray-100">
                    {row.c}
                  </td>
                  <td className={`py-3 px-4 sm:px-6 text-sm text-center border-b border-primary-100 bg-primary-50 ${
                    row.highlight ? 'font-bold text-primary-700 text-base' : 'font-semibold text-primary-600'
                  }`}>
                    {row.us}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-center text-sm text-gray-500 mt-4">
          Considering WebIntoApp specifically? Read our full{' '}
          <Link to="/blog/webintoapp-alternative-websitetoapp" className="text-primary-600 hover:underline font-medium">
            WebIntoApp alternative comparison
          </Link>{' '}
          — including free-tier watermark differences and desktop .exe support.
        </p>

        {/* Savings Highlight Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto mt-10 sm:mt-14">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-5 sm:p-6 text-center">
            <div className="inline-flex p-3 rounded-xl bg-green-100 mb-3">
              {getUserCurrency() === 'INR'
                ? <IndianRupee className="w-6 h-6 text-green-600" />
                : <DollarSign className="w-6 h-6 text-green-600" />
              }
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-green-700">
Up to $270
            </p>
            <p className="text-sm text-green-600 mt-1 font-medium">Saved vs competitors</p>
            <p className="text-xs text-gray-500 mt-2">Compared to average market price for similar features</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-5 sm:p-6 text-center">
            <div className="inline-flex p-3 rounded-xl bg-blue-100 mb-3">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-blue-700">No Recurring Fees</p>
            <p className="text-sm text-blue-600 mt-1 font-medium">One-time payment</p>
            <p className="text-xs text-gray-500 mt-2">Others charge monthly or yearly subscriptions that add up fast</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-violet-50 border-2 border-purple-200 rounded-2xl p-5 sm:p-6 text-center">
            <div className="inline-flex p-3 rounded-xl bg-purple-100 mb-3">
              <Zap className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-purple-700">50+ Features</p>
            <p className="text-sm text-purple-600 mt-1 font-medium">All included in one price</p>
            <p className="text-xs text-gray-500 mt-2">Others charge extra for push notifications, ads, biometric &amp; more</p>
          </div>
        </div>

        {/* Pricing FAQ — plain-text answers (t147 GEO) */}
        <div className="max-w-3xl mx-auto mt-14 sm:mt-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8 text-center">
            Pricing Questions, Answered Plainly
          </h2>
          <div className="space-y-4">
            {PRICING_FAQS.map((faq, i) => (
              <details key={faq.question} className="bg-white border rounded-xl p-6 group" open={i === 0}>
                <summary className="font-semibold text-gray-900 cursor-pointer list-none flex justify-between items-center">
                  {faq.question}
                  <span className="text-primary-500 group-open:rotate-45 transition-transform text-2xl">+</span>
                </summary>
                <p className="text-gray-600 mt-4 leading-relaxed">{faq.answer}</p>
              </details>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-4 text-center">
            Full refund terms are on the{' '}
            <Link to="/refund-policy" className="text-primary-600 hover:underline font-medium">refund policy</Link>{' '}
            page.
          </p>
        </div>

        {/* CTA */}
        <div className="text-center mt-10 sm:mt-14">
          <p className="text-gray-600 mb-5">Start with our free plan. No credit card required.</p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg shadow-primary-200 hover:shadow-xl font-semibold text-base"
          >
            Get Started Free
          </Link>
        </div>
      </section>
    </div>
  )
}
