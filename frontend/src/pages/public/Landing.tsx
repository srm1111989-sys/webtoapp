import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { formatPlanPrice } from '@/utils/format'
import { Smartphone, Monitor, Zap, Shield, ArrowRight, Star, Globe, Check } from 'lucide-react'
import { useSEO } from '@/hooks/useSEO'

const features = [
  { icon: Smartphone, title: 'Android Apps', desc: 'Convert your website into a native Android app with full-screen experience and smooth performance.' },
  { icon: Monitor, title: 'Windows Desktop Apps', desc: 'Generate a Windows .exe installer with configurable window, system tray, and more.' },
  { icon: Zap, title: 'Built in Minutes', desc: 'Configure your app with our wizard, pay, and get your builds automatically via CI/CD.' },
  { icon: Shield, title: 'Feature-Rich', desc: 'Push notifications, biometric auth, QR scanner, AdMob, navigation menus, and 10+ features.' },
]

const steps = [
  { num: '1', title: 'Enter Your URL', desc: 'Paste your website URL and configure basic settings.' },
  { num: '2', title: 'Customize', desc: 'Upload icon, set colors, enable features like push notifications.' },
  { num: '3', title: 'Choose Plan', desc: 'Select from Free, Basic, Pro, or Business plans.' },
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
    text: 'The free tier let me validate the idea before investing. Upgraded to Pro when we needed push notifications.',
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

const FALLBACK_PLANS = [
  {
    id: '1', name: 'Free', slug: 'free', price_inr: 0, price_usd: 0,
    billing_type: 'one_time', max_apps: 1, sort_order: 0,
    description: 'Try with basic features',
    highlights: ['Custom App Icon', 'Splash Screen', 'Custom Colors', 'Full-screen Mode'],
  },
  {
    id: '3', name: 'Pro', slug: 'pro', price_inr: 49900, price_usd: 999,
    billing_type: 'monthly', max_apps: 10, sort_order: 1,
    description: 'For professional developers',
    highlights: ['Everything in Free', 'Biometric Auth', 'QR Scanner', 'JS Bridge', 'Screenshot Prevention', 'Priority Support'],
  },
  {
    id: '4', name: 'Business', slug: 'business', price_inr: 99900, price_usd: 1999,
    billing_type: 'monthly', max_apps: 50, sort_order: 2,
    description: 'For agencies & enterprises',
    highlights: ['Everything in Pro', 'Up to 50 Apps', 'Signed AAB + Keystore', 'Priority Support'],
  },
  {
    id: '2', name: 'One Time', slug: 'one-time', price_inr: 299900, price_usd: 3500,
    billing_type: 'one_time', max_apps: 3, sort_order: 3,
    description: 'Pay once, use forever',
    highlights: ['Push Notifications', 'AdMob Ads', 'Deep Linking', 'Offline Mode', 'Play Store Bundle', 'No monthly fees'],
  },
]

const faqs = [
  { q: 'Do I need coding skills?', a: 'No. Our wizard guides you through the entire process. Just paste your website URL and customize visually.' },
  { q: 'Can I publish to Google Play Store?', a: 'Yes. Basic plan and above generate AAB (App Bundle) files that can be uploaded directly to Google Play Console.' },
  { q: 'Is the free plan really free?', a: 'Yes. The free plan generates a basic APK with core features. No credit card required. It includes a small "Powered by WebToApp" branding.' },
  { q: 'How long does it take to build?', a: 'Once you submit your configuration, the app is built automatically via our CI/CD pipeline. Typically 5-10 minutes.' },
  { q: 'Can I create both Android and Windows apps?', a: 'Yes! You can select one or both platforms in the wizard. Each platform generates its own build.' },
  { q: 'Do you offer refunds?', a: 'Yes. If you are not satisfied with the output, contact support within 7 days for a full refund.' },
]

export default function Landing() {
  useSEO({
    title: 'Convert Any Website Into Android & Windows Apps',
    description: 'Convert your website into professional Android APK, AAB, and Windows .exe apps in minutes. No coding required. Free plan available.',
  })
  const { accessToken } = useAuthStore()
  const isLoggedIn = !!accessToken
  const navigate = useNavigate()
  const [url, setUrl] = useState('')

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
      <section className="bg-gradient-to-br from-primary-600 to-primary-900 text-white py-12 sm:py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold mb-4 sm:mb-6">
            Convert Any Website Into<br className="hidden sm:block" />
            <span className="sm:hidden"> </span>Android & Desktop Apps
          </h1>
          <p className="text-base sm:text-xl lg:text-2xl text-primary-100 mb-6 sm:mb-8 max-w-3xl mx-auto">
            Turn your website into professional Android mobile apps and Windows desktop apps.
            No coding required. Get your APK or .exe in minutes.
          </p>

          {/* URL Input Box */}
          <div className="max-w-2xl mx-auto mb-6">
            <div className="flex flex-col sm:flex-row gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-2">
              <div className="flex-1 flex items-center bg-white rounded-lg px-4">
                <Globe className="w-5 h-5 text-gray-400 shrink-0" />
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Enter your website URL (e.g. https://yoursite.com)"
                  className="w-full py-3 px-3 text-gray-800 placeholder-gray-400 outline-none bg-transparent"
                  onKeyDown={(e) => e.key === 'Enter' && handleGetStarted()}
                />
              </div>
              <button
                onClick={handleGetStarted}
                className="bg-primary-500 hover:bg-primary-400 text-white px-8 py-3 rounded-lg font-semibold text-lg flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
              >
                {isLoggedIn ? 'Create App' : 'Get Started Free'} <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#pricing" className="border-2 border-white/50 text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors">
              View Pricing
            </a>
          </div>
          {!isLoggedIn && (
            <p className="mt-4 text-primary-200 text-sm">No credit card required. Free plan available.</p>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-12 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3 sm:mb-4">Why WebToApp?</h2>
          <p className="text-gray-600 text-center mb-8 sm:mb-12 max-w-2xl mx-auto text-sm sm:text-base">
            Everything you need to convert your website into professional Android and desktop apps.
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
            {features.map((f) => (
              <div key={f.title} className="text-center p-6 rounded-xl border hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <f.icon className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
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
      <section className="py-12 sm:py-20 bg-white">
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

      {/* Pricing */}
      <section id="pricing" className="py-12 sm:py-20 bg-gray-50 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3 sm:mb-4">Simple, Affordable Pricing</h2>
          <p className="text-gray-600 text-center mb-8 sm:mb-12 max-w-2xl mx-auto text-sm sm:text-base">
            Start free. Upgrade when you need more features. No hidden charges.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {FALLBACK_PLANS.map((plan) => (
              <div
                key={plan.slug}
                className={`bg-white border rounded-xl p-4 sm:p-6 flex flex-col relative ${
                  plan.slug === 'pro' ? 'border-primary-500 ring-2 ring-primary-500' : ''
                }`}
              >
                {plan.slug === 'pro' && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                    Most Popular
                  </span>
                )}
                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                <p className="text-gray-500 text-sm mb-3">{plan.description}</p>
                <div className="mb-1">
                  <span className="text-3xl font-bold">{formatPlanPrice(plan.price_inr, plan.price_usd)}</span>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  {plan.billing_type === 'monthly'
                    ? 'per month'
                    : plan.price_inr > 0
                      ? 'one-time'
                      : 'forever free'}
                </p>
                <ul className="space-y-2 flex-1 mb-6">
                  {plan.highlights.map((h) => (
                    <li key={h} className="flex items-center gap-2 text-sm text-gray-700">
                      <Check className="w-4 h-4 text-green-500 shrink-0" />
                      {h}
                    </li>
                  ))}
                </ul>
                <Link
                  to={isLoggedIn ? '/apps/create' : '/register'}
                  className={`block text-center py-2.5 rounded-lg font-medium transition-colors ${
                    plan.slug === 'pro'
                      ? 'bg-primary-600 text-white hover:bg-primary-700'
                      : 'border border-gray-300 hover:border-gray-400 text-gray-700'
                  }`}
                >
                  {plan.price_inr === 0 ? 'Start Free' : 'Get Started'}
                </Link>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/pricing" className="text-primary-600 hover:text-primary-700 font-medium text-sm">
              View full feature comparison →
            </Link>
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
      <section className="py-12 sm:py-20 bg-primary-600 text-white text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Ready to Convert Your Website?</h2>
          <p className="text-primary-100 mb-6 sm:mb-8 text-base sm:text-lg">
            Join thousands of businesses who have converted their websites into Android and desktop apps.
          </p>
          <Link to={isLoggedIn ? '/apps/create' : '/register'} className="bg-white text-primary-700 px-8 py-3 rounded-lg font-semibold text-lg hover:bg-gray-100 inline-flex items-center gap-2">
            {isLoggedIn ? 'Create New App' : 'Start Building'} <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
