import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { formatPlanPrice, getUserCurrency } from '@/utils/format'
import {
  Smartphone, Monitor, Zap, Shield, ArrowRight, Star, Globe, Check,
  Bell, Fingerprint, QrCode, WifiOff, Navigation, Camera, MapPin, Upload,
  Code, Palette, Share2, RefreshCw, LogOut, Cookie, Database, Settings,
  Video, Volume2, Vibrate, Battery, Info, BarChart, AlertCircle, Languages,
  Download, RotateCw, Maximize, TrendingDown, IndianRupee, DollarSign,
  Store, X, Loader2
} from 'lucide-react'
import { useSEO } from '@/hooks/useSEO'
import { createRazorpayOrder, verifyRazorpayPayment } from '@/api/razorpay-proxy'
import { plansApi } from '@/api/orders'

const features = [
  { icon: Smartphone, title: 'Android Apps', desc: 'Convert your website into a native Android app with full-screen experience and smooth performance.' },
  { icon: Monitor, title: 'Windows Desktop Apps', desc: 'Generate a Windows .exe installer with configurable window, system tray, and more.' },
  { icon: Zap, title: 'Built in Minutes', desc: 'Configure your app with our wizard, pay, and get your builds automatically delivered.' },
  { icon: Shield, title: 'Feature-Rich', desc: 'Push notifications, biometric auth, QR scanner, AdMob, navigation menus, and 10+ features.' },
]

const allPremiumFeatures = [
  { icon: Smartphone, title: 'Android App' },
  { icon: Monitor, title: 'Desktop App' },
  { icon: Shield, title: 'Custom Keystore Upload' },
  { icon: Bell, title: 'Push Notifications' },
  { icon: Fingerprint, title: 'Biometric Auth' },
  { icon: QrCode, title: 'QR Scanner' },
  { icon: WifiOff, title: 'Offline Mode' },
  { icon: Shield, title: 'Screenshot Block' },
  { icon: Navigation, title: 'Custom Navigation' },
  { icon: Camera, title: 'Camera Access' },
  { icon: MapPin, title: 'Location Services' },
  { icon: Upload, title: 'File Upload' },
  { icon: Code, title: 'JS Bridge' },
  { icon: Monitor, title: 'AdMob Ads' },
  { icon: Palette, title: 'Full Branding' },
  { icon: Share2, title: 'Social Sharing' },
  { icon: Star, title: 'Rate App' },
  { icon: RefreshCw, title: 'Pull to Refresh' },
  { icon: Shield, title: 'SSL Pinning' },
  { icon: Globe, title: 'Deep Linking' },
  { icon: Globe, title: 'In-App Browser' },
  { icon: LogOut, title: 'Exit Confirm' },
  { icon: Palette, title: 'Custom Fonts' },
  { icon: Settings, title: 'User Agent' },
  { icon: RotateCw, title: 'Orientation Lock' },
  { icon: Maximize, title: 'Fullscreen Mode' },
  { icon: Monitor, title: 'Keep Screen On' },
  { icon: Download, title: 'Download Manager' },
  { icon: Cookie, title: 'Cookie Control' },
  { icon: Database, title: 'Cache Manager' },
  { icon: Settings, title: 'Custom Headers' },
  { icon: Zap, title: 'Hardware Accel' },
  { icon: Video, title: 'Media Playback' },
  { icon: Volume2, title: 'Audio Focus' },
  { icon: Vibrate, title: 'Vibration API' },
  { icon: Battery, title: 'Battery Status' },
  { icon: Info, title: 'Device Info' },
  { icon: BarChart, title: 'Analytics' },
  { icon: AlertCircle, title: 'Crash Reports' },
  { icon: Zap, title: 'Auto Updates' },
  { icon: Languages, title: 'Multi-Language' },
]

const steps = [
  { num: '1', title: 'Enter Your URL', desc: 'Paste your website URL and configure basic settings.' },
  { num: '2', title: 'Customize', desc: 'Upload icon, set colors, enable features like push notifications.' },
  { num: '3', title: 'Choose Plan', desc: 'Choose your plan and complete payment.' },
  { num: '4', title: 'Get Your App', desc: 'Download APK, AAB, or Windows .exe built automatically.' },
]

const testimonials = [
  {
    name: 'Rahul Sharma',
    role: 'Small Business Owner',
    text: 'Converted my Shopify store to an Android app in 10 minutes. Push notifications increased my repeat customers by 30%.',
    rating: 5,
    avatar: 'https://ui-avatars.com/api/?name=Rahul+Sharma&background=3b82f6&color=fff&size=80',
  },
  {
    name: 'Priya Mehta',
    role: 'Freelance Developer',
    text: 'I use WebToApp for all my clients. The apps look truly native and perform great. Business plan is perfect for agencies.',
    rating: 5,
    avatar: 'https://ui-avatars.com/api/?name=Priya+Mehta&background=8b5cf6&color=fff&size=80',
  },
  {
    name: 'Alex Kim',
    role: 'Startup Founder',
    text: 'WebToApp helped me validate the idea quickly. One-time payment made it affordable compared to monthly subscriptions.',
    rating: 5,
    avatar: 'https://ui-avatars.com/api/?name=Alex+Kim&background=06b6d4&color=fff&size=80',
  },
  {
    name: 'Sneha Patel',
    role: 'Restaurant Owner',
    text: 'My customers love the app! They get notified about daily specials instantly. Orders have gone up 25% since we launched.',
    rating: 5,
    avatar: 'https://ui-avatars.com/api/?name=Sneha+Patel&background=ec4899&color=fff&size=80',
  },
  {
    name: 'David Wilson',
    role: 'Marketing Director',
    text: 'We converted our WordPress site into both Android and Windows apps. The desktop app is perfect for our B2B clients.',
    rating: 5,
    avatar: 'https://ui-avatars.com/api/?name=David+Wilson&background=f59e0b&color=fff&size=80',
  },
  {
    name: 'Ankit Verma',
    role: 'E-commerce Entrepreneur',
    text: 'Best investment for my online store. The biometric login and offline mode make it feel premium. My customers think I spent lakhs on it.',
    rating: 5,
    avatar: 'https://ui-avatars.com/api/?name=Ankit+Verma&background=10b981&color=fff&size=80',
  },
  {
    name: 'Sarah Johnson',
    role: 'Fitness Coach',
    text: 'My training website is now an app my clients use daily. The bottom navigation makes it so easy to switch between workouts and diet plans.',
    rating: 4,
    avatar: 'https://ui-avatars.com/api/?name=Sarah+Johnson&background=ef4444&color=fff&size=80',
  },
  {
    name: 'Mohammed Ali',
    role: 'EdTech Founder',
    text: 'We converted our LMS into a mobile app. Students can now access courses offline. Downloads doubled in the first month.',
    rating: 5,
    avatar: 'https://ui-avatars.com/api/?name=Mohammed+Ali&background=6366f1&color=fff&size=80',
  },
]

const ANDROID_FALLBACK = { slug: 'android-paid', price_inr: 1000, price_usd: 1000,
  highlights: ['All 40+ Features', 'No Watermark', 'Custom Keystore Upload', 'Keystore Included', '10 Builds / 30 Days', 'Publish App on Google Play Store'] }
const DESKTOP_FALLBACK = { slug: 'desktop-paid', price_inr: 1000, price_usd: 1000,
  highlights: ['All Desktop Features', 'No Watermark', 'Windows .exe Installer', 'System Tray Support', 'Custom Window Settings', '10 Builds / 30 Days'] }

const faqs = [
  { q: 'Do I need coding skills?', a: 'No. Our wizard guides you through the entire process. Just paste your website URL and customize visually.' },
  { q: 'Can I publish to Google Play Store?', a: 'Yes! The Paid plan includes signed AAB files ready for Play Store submission.' },
  { q: 'Can I use my existing keystore signature?', a: 'Yes! If you already have an app live on the Google Play Store, you can upload your existing custom keystore (.jks or .keystore) and credentials in our advanced settings so you can release updates seamlessly.' },
  { q: 'How long does it take to build?', a: 'Once you submit your configuration, the app is built automatically. Typically 5-10 minutes.' },
  { q: 'Can I create both Android and Windows apps?', a: 'Yes! You can select one or both platforms in the wizard. Each platform generates its own build.' },
  { q: 'Do you offer refunds?', a: 'Yes. If you are not satisfied with the output, contact support within 7 days for a full refund.' },
  { q: 'Is WebToApp better than GoNative or WebIntoApp?', a: 'WebToApp offers 40+ features at a one-time price from $10 — vs GoNative ($99/month) and WebIntoApp ($149+/year). You get more features for less, with no recurring subscription.' },
  { q: 'What websites can I convert to an app?', a: 'Any website works — Shopify, WordPress, WooCommerce, React apps, custom sites, LMS platforms, booking systems, and more. If it runs in a browser, it runs in WebToApp.' },
  { q: 'Will my app be approved by Google Play?', a: 'Yes. We generate a properly signed AAB that meets Google Play guidelines. We also include a compliance checklist to help you submit without rejections.' },
]

export default function Landing() {
  useSEO({
    title: 'Convert Website to Android App Free — WebsiteToApp',
    description: 'Convert any website to an Android app in 5 minutes. Free forever plan. Push notifications, splash screen, offline support. Trusted by 1000+ developers.',
    canonical: 'https://websitetoapp.app/',
  })

  useEffect(() => {
    const schema = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          '@id': 'https://websitetoapp.app/#website',
          url: 'https://websitetoapp.app/',
          name: 'WebToApp',
          description: 'Convert any website to a native Android or Windows app in minutes.',
          potentialAction: {
            '@type': 'SearchAction',
            target: { '@type': 'EntryPoint', urlTemplate: 'https://websitetoapp.app/convert?url={search_term_string}' },
            'query-input': 'required name=search_term_string',
          },
        },
        {
          '@type': 'FAQPage',
          mainEntity: faqs.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        },
        {
          '@type': 'SoftwareApplication',
          name: 'WebToApp',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Android, Windows',
          offers: { '@type': 'Offer', price: '10', priceCurrency: 'USD' },
          aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.9', reviewCount: '312' },
        },
      ],
    }
    let el = document.getElementById('landing-jsonld')
    if (!el) {
      el = document.createElement('script')
      el.id = 'landing-jsonld'
      el.setAttribute('type', 'application/ld+json')
      document.head.appendChild(el)
    }
    el.textContent = JSON.stringify(schema)
    return () => { el?.remove() }
  }, [])
  const { accessToken } = useAuthStore()
  const isLoggedIn = !!accessToken
  const navigate = useNavigate()

  const { data: plansData } = useQuery({ queryKey: ['plans'], queryFn: () => plansApi.list().then(r => r.data), staleTime: 5 * 60 * 1000 })
  const androidPlan = plansData?.find((p: any) => p.slug === 'android-paid') ?? ANDROID_FALLBACK
  const desktopPlan = plansData?.find((p: any) => p.slug === 'desktop-paid') ?? DESKTOP_FALLBACK
  const androidHighlights = ANDROID_FALLBACK.highlights
  const desktopHighlights = DESKTOP_FALLBACK.highlights

  const [url, setUrl] = useState('')
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [publishForm, setPublishForm] = useState({ name: '', email: '', appName: '', websiteUrl: '', notes: '' })
  const [publishLoading, setPublishLoading] = useState(false)
  const [publishSuccess, setPublishSuccess] = useState(false)

  const handlePublishPayment = async () => {
    if (!publishForm.name || !publishForm.email || !publishForm.appName) return
    setPublishLoading(true)
    try {
      const order = await createRazorpayOrder({
        amount: 1000,
        currency: 'USD',
        receipt: `publish_${Date.now()}`,
        notes: { name: publishForm.name, email: publishForm.email, appName: publishForm.appName, websiteUrl: publishForm.websiteUrl, notes: publishForm.notes, service: 'play-store-publish' },
      })
      const options = {
        key: order.razorpay_key_id,
        amount: order.amount,
        currency: order.currency,
        name: 'WebToApp',
        description: 'Publish App on Google Play Store',
        order_id: order.razorpay_order_id,
        handler: async (response: any) => {
          try {
            await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })
            setPublishSuccess(true)
          } catch {
            alert('Payment verification failed. Please contact support@websitetoapp.app')
          }
        },
        prefill: { name: publishForm.name, email: publishForm.email },
        theme: { color: '#4f46e5' },
      }
      const rzp = new (window as any).Razorpay(options)
      rzp.open()
    } catch {
      alert('Failed to initiate payment. Please try again.')
    } finally {
      setPublishLoading(false)
    }
  }

  const handleGetStarted = () => {
    const target = isLoggedIn ? '/apps/create' : '/register'
    if (url.trim()) {
      navigate(`${target}?url=${encodeURIComponent(url.trim())}`)
    } else {
      navigate(target)
    }
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-white via-primary-50 to-white py-6 sm:py-8 lg:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3 leading-tight text-gray-900 text-center">
            Convert Any Website to an App <span className="text-primary-600">in 5 Minutes</span>
          </h1>
          <p className="text-sm sm:text-lg text-gray-600 mb-3 sm:mb-4 max-w-3xl mx-auto text-center">
            No coding required. One-time payment from <strong>$10</strong> — 90% cheaper than GoNative, Median &amp; WebIntoApp. No subscriptions, ever.
          </p>

          {/* URL Input Box */}
          <div className="max-w-4xl mb-0 mx-auto">
            <div className="flex flex-col sm:flex-row gap-3 bg-white rounded-xl p-2 sm:p-3 shadow-xl border-2 border-primary-100">
              <div className="flex-1 flex items-center bg-gray-50 rounded-lg px-4 border border-gray-200">
                <Globe className="w-5 h-5 text-gray-400 shrink-0" />
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Enter your website URL (e.g. https://yoursite.com)"
                  className="w-full py-3.5 px-3 text-gray-800 placeholder-gray-400 outline-none bg-transparent text-base sm:text-lg"
                  onKeyDown={(e) => e.key === 'Enter' && handleGetStarted()}
                />
              </div>
              <button
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-10 py-3.5 rounded-lg font-semibold text-lg flex items-center justify-center gap-2 transition-all shadow-lg whitespace-nowrap"
              >
                {isLoggedIn ? 'Create App' : 'Convert'} <ArrowRight className="w-5 h-5" />
              </button>
            </div>
            {/* Publish App CTA — below URL box */}
            <Link
              to="/publish-app"
              className="mt-5 flex flex-col sm:flex-row items-center gap-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-300 rounded-2xl px-5 py-4 sm:py-5 hover:border-indigo-400 hover:shadow-md transition-all group no-underline"
            >
              <div className="p-3 bg-indigo-600 rounded-xl shrink-0 shadow-lg group-hover:bg-indigo-700 transition-all">
                <Store className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <p className="text-xs text-indigo-500 font-semibold uppercase tracking-wider mb-0.5">Already have an Android app?</p>
                <p className="text-base sm:text-lg font-bold text-indigo-900 leading-tight">Publish Your App on Google Play Store</p>
                <p className="text-xs sm:text-sm text-indigo-600 mt-0.5">Expert submission, full store listing setup — just $10 flat</p>
              </div>
              <div className="shrink-0 bg-indigo-600 group-hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 whitespace-nowrap">
                Get Started — $10 <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          </div>

          {/* Inline Pricing - COMMENTED OUT */}
          {/* <div className="max-w-6xl mx-auto">
            <p className="text-primary-200 text-xs sm:text-sm mb-4 uppercase tracking-wider font-medium">Simple, transparent pricing</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
              {[...ANDROID_PLANS, ...DESKTOP_PLANS].map((plan) => (
                <div
                  key={plan.slug}
                  className={`bg-white/10 backdrop-blur-sm rounded-xl px-3 py-3 sm:px-4 sm:py-4 text-center border ${
                    plan.slug === 'android-paid' ? 'border-white/40 bg-white/15' : 'border-white/10'
                  }`}
                >
                  <p className="text-[10px] sm:text-xs text-primary-200 uppercase tracking-wide mb-1">
                    {plan.slug.startsWith('desktop') ? 'Desktop' : plan.slug === 'play-store-submission' ? 'Service' : 'Android'}
                  </p>
                  <p className="text-sm sm:text-base font-semibold text-white mb-1">{plan.name}</p>
                  <p className="text-lg sm:text-2xl font-bold text-white">
                    {formatPlanPrice(plan.price_inr, plan.price_usd)}
                  </p>
                  <p className="text-[10px] sm:text-xs text-primary-200 mt-0.5">
                    {plan.price_inr > 0 ? 'one-time' : plan.slug === 'desktop-free' ? '3-day trial' : 'forever free'}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-primary-200 text-xs sm:text-sm">
              No credit card required for free plans. No hidden charges. No subscriptions.
            </p>
          </div> */}
        </div>
      </section>

      {/* Price Comparison */}
      <section className="py-12 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-14">
            <p className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-3">Price Comparison with Other Competitors</p>
            <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              <TrendingDown className="w-4 h-4" />
              Save up to 95%
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
              WebToApp vs GoNative vs WebIntoApp vs Median
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base">
              GoNative charges $99/month. Median starts at $99/month. WebIntoApp costs $149+/year. WebToApp is a one-time $10 payment with more features than all of them.
            </p>
          </div>

          {/* Compact Comparison */}
          <div className="max-w-4xl mx-auto overflow-x-auto -mx-4 px-4 sm:mx-auto sm:px-0">
            <table className="w-full border-collapse min-w-[600px]">
              <thead>
                <tr>
                  <th className="text-left py-3 px-3 sm:px-5 text-xs sm:text-sm font-semibold text-gray-500 border-b-2 border-gray-100"></th>
                  <th className="py-3 px-3 sm:px-5 text-xs sm:text-sm font-semibold text-gray-400 border-b-2 border-gray-100 text-center">WebIntoApp</th>
                  <th className="py-3 px-3 sm:px-5 text-xs sm:text-sm font-semibold text-gray-400 border-b-2 border-gray-100 text-center">GoNative</th>
                  <th className="py-3 px-3 sm:px-5 text-xs sm:text-sm font-semibold text-gray-400 border-b-2 border-gray-100 text-center">Median</th>
                  <th className="py-3 px-3 sm:px-5 text-xs sm:text-sm font-bold border-b-2 border-primary-300 text-center bg-primary-50 rounded-t-xl text-primary-700">WebToApp</th>
                </tr>
              </thead>
              <tbody>
                {([
                  { feature: 'Starting Price', a: '$99/mo', b: '$16/yr', c: '$99/mo', us: '$10 once', bold: true },
                  { feature: '1-Year Total Cost', a: '$1,188+', b: '$60+', c: '$1,188+', us: '$10', bold: true },
                  { feature: 'Android App', a: '✓', b: '✓', c: '✓', us: '✓', bold: false },
                  { feature: 'Windows Desktop App', a: '✗', b: '✗', c: '✗', us: '✓', bold: false },
                  { feature: 'Push Notifications', a: 'Included', b: 'Add-on ($)', c: 'JS Bridge', us: '✓ Included', bold: false },
                  { feature: 'Biometric Auth', a: 'JS Bridge', b: '✗', c: 'JS Bridge', us: '✓ Included', bold: false },
                  { feature: 'AdMob / Monetization', a: '✗', b: '✗', c: '✗', us: '✓ Included', bold: false },
                  { feature: 'No Watermark', a: '✓', b: 'Paid tier', c: '✓', us: '✓ Always', bold: false },
                  { feature: 'No-Code Setup', a: 'Partial', b: '✓', c: 'Dev skills', us: '✓ Wizard', bold: false },
                  { feature: 'Total Features', a: '~20', b: '~15', c: '~20', us: '40+', bold: false },
                ]).map((row, idx) => (
                  <tr key={idx} className={row.bold ? 'bg-gray-50' : ''}>
                    <td className="py-2.5 px-3 sm:px-5 text-xs sm:text-sm font-medium text-gray-900 border-b border-gray-100">{row.feature}</td>
                    <td className="py-2.5 px-3 sm:px-5 text-xs sm:text-sm text-gray-500 text-center border-b border-gray-100">{row.a}</td>
                    <td className="py-2.5 px-3 sm:px-5 text-xs sm:text-sm text-gray-500 text-center border-b border-gray-100">{row.b}</td>
                    <td className="py-2.5 px-3 sm:px-5 text-xs sm:text-sm text-gray-500 text-center border-b border-gray-100">{row.c}</td>
                    <td className={`py-2.5 px-3 sm:px-5 text-xs sm:text-sm text-center border-b border-primary-100 bg-primary-50 ${
                      row.bold ? 'font-bold text-primary-700 text-sm sm:text-base' : 'font-semibold text-primary-600'
                    }`}>{row.us}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Savings Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto mt-10">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-5 text-center">
              <div className="inline-flex p-2.5 rounded-xl bg-green-100 mb-3">
                {getUserCurrency() === 'INR'
                  ? <IndianRupee className="w-5 h-5 text-green-600" />
                  : <DollarSign className="w-5 h-5 text-green-600" />
                }
              </div>
              <p className="text-xl sm:text-2xl font-bold text-green-700">
                Save $270+
              </p>
              <p className="text-xs text-green-600 mt-1 font-medium">vs market average</p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-5 text-center">
              <div className="inline-flex p-2.5 rounded-xl bg-blue-100 mb-3">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-blue-700">No Subscriptions</p>
              <p className="text-xs text-blue-600 mt-1 font-medium">One-time payment only</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-violet-50 border-2 border-purple-200 rounded-2xl p-5 text-center">
              <div className="inline-flex p-2.5 rounded-xl bg-purple-100 mb-3">
                <Zap className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-purple-700">50+ Features</p>
              <p className="text-xs text-purple-600 mt-1 font-medium">All included, no extras</p>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto">
            {[
              { name: 'GoNative', slug: 'gonative', price: '$99–$299/mo' },
              { name: 'WebIntoApp', slug: 'webintoapp', price: '$16–$60/yr' },
              { name: 'Median.co', slug: 'median', price: '$99–$299/mo' },
              { name: 'AppsGeyser', slug: 'appsgeyser', price: 'Free + $9.99/mo' },
            ].map((c) => (
              <Link
                key={c.slug}
                to={`/alternatives/${c.slug}`}
                className="bg-white border border-gray-200 rounded-xl p-4 text-center hover:border-primary-300 hover:shadow-md transition-all"
              >
                <p className="font-semibold text-sm text-gray-900 mb-1">vs {c.name}</p>
                <p className="text-xs text-red-500 font-medium mb-2">{c.price}</p>
                <p className="text-xs text-primary-600">Full comparison →</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-6 sm:py-10 bg-white scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Pricing Header */}
          <div className="mb-6 text-center">
            <h2 className="text-2xl sm:text-4xl font-bold mb-2">Simple, Transparent Pricing</h2>
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-full px-6 py-3 mb-2">
              <Check className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-green-900">ALL 40+ Features Included</span>
            </div>
            <p className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base">
              One-time payment • No subscriptions • No hidden charges • Lifetime access
            </p>
          </div>

          {/* Pricing Cards - Android & Desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-5xl mx-auto">
            {/* Android Card */}
            <div className="bg-white border-2 border-primary-500 ring-2 ring-primary-500 rounded-2xl p-4 sm:p-5 flex flex-col relative shadow-xl hover:shadow-2xl transition-shadow">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs px-4 py-1 rounded-full font-medium shadow-lg">
                🔥 Most Popular
              </span>
              <div className="absolute -top-3 -right-3 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm px-4 py-2 rounded-full font-bold shadow-xl animate-pulse">
                50% OFF
              </div>
              <div className="flex items-center gap-2 mb-3">
                <Smartphone className="w-6 h-6 text-primary-600" />
                <h3 className="text-2xl font-bold">Android App</h3>
              </div>
              <p className="text-gray-500 text-sm mb-3">All features, one-time payment</p>

              {/* Pricing with MRP */}
              <div className="mb-1 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-3 sm:p-4 border-2 border-primary-200 relative overflow-hidden">
                {/* MRP - Strikethrough */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-gray-500 font-medium">MRP:</span>
                  <span className="text-xl font-bold text-gray-400 line-through">$30</span>
                </div>

                {/* Actual Price - Large and Bold */}
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent leading-none">
                    {formatPlanPrice(androidPlan.price_inr, androidPlan.price_usd)}
                  </span>
                </div>

                {/* You Save Badge */}
                <div className="mt-3 inline-flex items-center gap-1.5 bg-green-100 text-green-800 px-3 py-1.5 rounded-lg text-sm font-bold border border-green-200">
                  <Check className="w-4 h-4" />
                  You Save $20
                </div>
              </div>

              <p className="text-sm font-semibold text-primary-600 mb-4 mt-2">
                💎 One-time payment · Lifetime access
              </p>
              <ul className="space-y-2 flex-1 mb-6">
                {androidHighlights.map((h, i) => (
                  <li key={h} className={`flex items-center gap-2 text-sm ${i === androidHighlights.length - 1 ? 'text-indigo-700 font-semibold bg-indigo-50 rounded-lg px-2 py-1' : 'text-gray-700'}`}>
                    <Check className={`w-4 h-4 shrink-0 ${i === androidHighlights.length - 1 ? 'text-indigo-500' : 'text-green-500'}`} />
                    {h}
                  </li>
                ))}
              </ul>
              <Link
                to={isLoggedIn ? '/apps/create' : '/register'}
                className="block text-center py-3 rounded-lg font-semibold transition-all bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 shadow-lg"
              >
                Get Started
              </Link>
            </div>

            {/* Desktop Card */}
            <div className="bg-white border-2 border-primary-500 ring-2 ring-primary-500 rounded-2xl p-4 sm:p-5 flex flex-col relative shadow-xl hover:shadow-2xl transition-shadow">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-xs px-4 py-1 rounded-full font-medium shadow-lg">
                💻 Best Value
              </span>
              <div className="absolute -top-3 -right-3 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm px-4 py-2 rounded-full font-bold shadow-xl animate-pulse">
                50% OFF
              </div>
              <div className="flex items-center gap-2 mb-3">
                <Monitor className="w-6 h-6 text-primary-600" />
                <h3 className="text-2xl font-bold">Desktop App</h3>
              </div>
              <p className="text-gray-500 text-sm mb-3">Full desktop app, one-time</p>

              {/* Pricing with MRP */}
              <div className="mb-1 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-3 sm:p-4 border-2 border-primary-200 relative overflow-hidden">
                {/* MRP - Strikethrough */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-gray-500 font-medium">MRP:</span>
                  <span className="text-xl font-bold text-gray-400 line-through">$20</span>
                </div>

                {/* Actual Price - Large and Bold */}
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent leading-none">
                    {formatPlanPrice(desktopPlan.price_inr, desktopPlan.price_usd)}
                  </span>
                </div>

                {/* You Save Badge */}
                <div className="mt-3 inline-flex items-center gap-1.5 bg-green-100 text-green-800 px-3 py-1.5 rounded-lg text-sm font-bold border border-green-200">
                  <Check className="w-4 h-4" />
                  You Save $10
                </div>
              </div>

              <p className="text-sm font-semibold text-primary-600 mb-4 mt-2">
                💎 One-time payment · Lifetime access
              </p>
              <ul className="space-y-2 flex-1 mb-6">
                {desktopHighlights.map((h) => (
                  <li key={h} className="flex items-center gap-2 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-500 shrink-0" />
                    {h}
                  </li>
                ))}
              </ul>
              <Link
                to={isLoggedIn ? '/apps/create' : '/register'}
                className="block text-center py-3 rounded-lg font-semibold transition-all bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 shadow-lg"
              >
                Get Started
              </Link>
            </div>
          </div>

          <div className="text-center mt-8">
            <Link to="/pricing" className="text-primary-600 hover:text-primary-700 font-medium text-sm">
              View full feature comparison →
            </Link>
          </div>
        </div>
      </section>

      {/* Publish on Playstore Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setShowPublishModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowPublishModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>

            {publishSuccess ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Successful!</h3>
                <p className="text-gray-600 text-sm mb-4">Our team will contact you within 24 hours at <strong>{publishForm.email}</strong>.</p>
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-left">
                  <p className="text-sm font-semibold text-indigo-900 mb-2">📋 Next Step — Action Required:</p>
                  <p className="text-sm text-indigo-700">Please add our email to your Google Play Console account with <strong>Release Manager</strong> permissions:</p>
                  <p className="text-sm font-bold text-indigo-900 mt-2 bg-white rounded-lg px-3 py-2 border border-indigo-200">support@websitetoapp.app</p>
                  <p className="text-xs text-indigo-600 mt-2">Go to Play Console → Users and permissions → Invite new users → Enter our email → Grant Release Manager access.</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2 bg-indigo-100 rounded-xl"><Store className="w-6 h-6 text-indigo-600" /></div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Publish App on Play Store</h3>
                    <p className="text-sm text-indigo-600 font-semibold">$10 one-time</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={publishForm.name}
                      onChange={(e) => setPublishForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Your name"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      value={publishForm.email}
                      onChange={(e) => setPublishForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="your@email.com"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">App Name *</label>
                    <input
                      type="text"
                      value={publishForm.appName}
                      onChange={(e) => setPublishForm(f => ({ ...f, appName: e.target.value }))}
                      placeholder="e.g. My Store App"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Website / App URL</label>
                    <input
                      type="url"
                      value={publishForm.websiteUrl}
                      onChange={(e) => setPublishForm(f => ({ ...f, websiteUrl: e.target.value }))}
                      placeholder="https://yoursite.com"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                    <textarea
                      value={publishForm.notes}
                      onChange={(e) => setPublishForm(f => ({ ...f, notes: e.target.value }))}
                      placeholder="Any special requirements or info about your app..."
                      rows={2}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  </div>
                </div>

                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                  <p className="font-semibold mb-1">📌 Note:</p>
                  <p>Our team will contact you shortly after payment. You will need to add our email <strong>support@websitetoapp.app</strong> to your Play Console account with <strong>Release Manager</strong> permissions to allow us to publish.</p>
                </div>

                <button
                  onClick={handlePublishPayment}
                  disabled={publishLoading || !publishForm.name || !publishForm.email || !publishForm.appName}
                  className="mt-4 w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  {publishLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Store className="w-4 h-4" /> Pay $10 &amp; Submit Request</>}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Why Choose WebToApp */}
      <section className="pt-8 sm:pt-12 pb-16 sm:pb-24 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">Why Choose WebToApp?</h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Get <span className="text-primary-600 font-semibold">40+ premium features</span> in one affordable plan.
              No subscriptions. No hidden fees. Just a simple one-time payment.
            </p>
          </div>

          {/* Value Props */}
          <div className="grid md:grid-cols-3 gap-6 sm:gap-8 mb-16">
            <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-primary-100 hover:border-primary-300 transition-all">
              <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center mb-4">
                <Star className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">40+ Premium Features</h3>
              <p className="text-gray-600 mb-4">
                Push notifications, biometric auth, AdMob ads, offline mode, navigation menus, and 35+ more features included.
              </p>
              <Link to="/features" className="text-primary-600 font-semibold inline-flex items-center gap-1 hover:gap-2 transition-all">
                View all features <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-green-100 hover:border-green-300 transition-all">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">One-Time Payment</h3>
              <p className="text-gray-600 mb-4">
                Pay once, own forever. Android: $10. Desktop: $10. No subscriptions.
                <span className="font-semibold text-green-600"> 90% cheaper than competitors!</span>
              </p>
              <Link to="/pricing" className="text-green-600 font-semibold inline-flex items-center gap-1 hover:gap-2 transition-all">
                See pricing <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-blue-100 hover:border-blue-300 transition-all">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">Build in 5 Minutes</h3>
              <p className="text-gray-600 mb-4">
                Simple 4-step wizard. Enter URL, customize visuals, enable features, pay.
                Your APK/AAB/EXE builds automatically and is delivered instantly.
              </p>
              <Link to="/register" className="text-blue-600 font-semibold inline-flex items-center gap-1 hover:gap-2 transition-all">
                Get started free <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* All Features - Grid on Desktop, Scroll on Mobile */}
          <div className="mb-16">
            <div className="text-center mb-8">
              <h3 className="text-2xl sm:text-3xl font-bold mb-2">All 40+ Features at a Glance</h3>
              <p className="text-gray-600 md:hidden">👉 Swipe horizontally to see all features →</p>
              <p className="text-gray-600 hidden md:block">Everything included in one simple plan</p>
            </div>

            {/* Mobile - Horizontal Scroll */}
            <div className="md:hidden relative -mx-4 sm:-mx-6">
              {/* Fade edges */}
              <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
              <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>

              {/* Scrollable container */}
              <div className="overflow-x-scroll overflow-y-hidden pb-4 px-4 sm:px-6 scrollbar-hide">
                <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
                  {allPremiumFeatures.map((feature, idx) => (
                    <div
                      key={idx}
                      className="flex-none w-40 bg-white rounded-xl border-2 border-primary-200 p-4 hover:border-primary-500 hover:shadow-xl transition-all"
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center mb-3 mx-auto shadow-lg">
                        <feature.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-sm text-gray-900 leading-tight mb-2">{feature.title}</p>
                        <Check className="w-4 h-4 text-green-600 mx-auto" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Desktop - Grid Layout */}
            <div className="hidden md:grid md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {allPremiumFeatures.map((feature, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-xl border-2 border-primary-200 p-4 hover:border-primary-500 hover:shadow-xl transition-all"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center mb-3 mx-auto shadow-lg">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-sm text-gray-900 leading-tight mb-2">{feature.title}</p>
                    <Check className="w-4 h-4 text-green-600 mx-auto" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Features Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {features.map((f) => (
              <div key={f.title} className="text-center p-6 bg-white rounded-xl border-2 border-gray-100 hover:border-primary-200 hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <f.icon className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="font-semibold mb-2 text-gray-900">{f.title}</h3>
                <p className="text-gray-600 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-12 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12">How It Works</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
            {steps.map((s, i) => (
              <div key={s.num} className="text-center relative">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-600 text-white rounded-full flex items-center justify-center text-lg sm:text-xl font-bold mx-auto mb-3 sm:mb-4">
                  {s.num}
                </div>
                <h3 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">{s.title}</h3>
                <p className="text-gray-600 text-xs sm:text-sm">{s.desc}</p>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-[60%] w-[80%] border-t-2 border-dashed border-gray-300" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3 sm:mb-4">What Our Users Say</h2>
          <p className="text-gray-600 text-center mb-8 sm:mb-12 max-w-2xl mx-auto text-sm sm:text-base">
            Trusted by thousands of businesses, developers, and entrepreneurs worldwide.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                  {Array.from({ length: 5 - t.rating }).map((_, i) => (
                    <Star key={`e${i}`} className="w-4 h-4 text-gray-200" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm mb-4">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="w-10 h-10 rounded-full"
                    loading="lazy"
                  />
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-gray-500 text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 sm:py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {faqs.map((f) => (
              <div key={f.q} className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="font-semibold mb-2">{f.q}</h3>
                <p className="text-gray-600 text-sm">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      {/* Guide CTA */}
      <section className="py-10 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Not sure which method is right for you?</h2>
          <p className="text-gray-600 mb-4">Read our complete guide comparing all 5 methods to convert your website to an app.</p>
          <Link to="/blog/convert-website-to-app-guide-2026" className="text-primary-600 font-semibold hover:underline text-lg">
            📖 Read: How to Convert Any Website to a Mobile App (2026 Guide) →
          </Link>
        </div>
      </section>

      <section className="py-12 sm:py-20 bg-primary-600 text-white text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Convert Your Website to an App Today</h2>
          <p className="text-primary-100 mb-6 sm:mb-8 text-base sm:text-lg">
            One-time payment. No subscription. 7-day money-back guarantee. Join thousands of businesses already on mobile.
          </p>
          <Link to={isLoggedIn ? '/apps/create' : '/register'} className="bg-white text-primary-700 px-8 py-3 rounded-lg font-semibold text-lg hover:bg-gray-100 inline-flex items-center gap-2">
            {isLoggedIn ? 'Create New App' : 'Convert My Website — From $10'} <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
