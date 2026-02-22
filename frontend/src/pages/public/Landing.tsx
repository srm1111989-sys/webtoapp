import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Smartphone, Monitor, Zap, Shield, ArrowRight, Star, Globe } from 'lucide-react'

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
    text: 'I use WebToApp for all my clients. The apps look truly native and perform great. Business plan gives me source code too.',
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

const faqs = [
  { q: 'Do I need coding skills?', a: 'No. Our wizard guides you through the entire process. Just paste your website URL and customize visually.' },
  { q: 'Can I publish to Google Play Store?', a: 'Yes. Basic plan and above generate AAB (App Bundle) files that can be uploaded directly to Google Play Console.' },
  { q: 'Is the free plan really free?', a: 'Yes. The free plan generates a basic APK with core features. No credit card required. It includes a small "Powered by WebToApp" branding.' },
  { q: 'How long does it take to build?', a: 'Once you submit your configuration, the app is built automatically via our CI/CD pipeline. Typically 5-10 minutes.' },
  { q: 'Can I create both Android and Windows apps?', a: 'Yes! You can select one or both platforms in the wizard. Each platform generates its own build.' },
  { q: 'Do you offer refunds?', a: 'Yes. If you are not satisfied with the output, contact support within 7 days for a full refund.' },
]

export default function Landing() {
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
      <section className="bg-gradient-to-br from-primary-600 to-primary-900 text-white py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-6xl font-bold mb-6">
            Convert Any Website Into<br />Android & Desktop Apps
          </h1>
          <p className="text-xl lg:text-2xl text-primary-100 mb-8 max-w-3xl mx-auto">
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
            <Link to="/pricing" className="border-2 border-white/50 text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors">
              View Pricing
            </Link>
          </div>
          {!isLoggedIn && (
            <p className="mt-4 text-primary-200 text-sm">No credit card required. Free plan available.</p>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4">Why WebToApp?</h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Everything you need to convert your website into professional Android and desktop apps.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
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
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((s, i) => (
              <div key={s.num} className="text-center relative">
                <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {s.num}
                </div>
                <h3 className="font-semibold mb-2">{s.title}</h3>
                <p className="text-gray-600 text-sm">{s.desc}</p>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-[60%] w-[80%] border-t-2 border-dashed border-gray-300" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4">What Our Users Say</h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Trusted by thousands of businesses, developers, and entrepreneurs worldwide.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
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
      <section className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
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
      <section className="py-20 bg-primary-600 text-white text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">Ready to Convert Your Website?</h2>
          <p className="text-primary-100 mb-8 text-lg">
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
