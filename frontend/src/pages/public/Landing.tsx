import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Smartphone, Zap, Shield, Globe, ArrowRight, CheckCircle, Star } from 'lucide-react'

const features = [
  { icon: Smartphone, title: 'TWA-First Approach', desc: 'Full-screen Chrome experience with WebView fallback for maximum compatibility.' },
  { icon: Zap, title: 'Built in Minutes', desc: 'Configure your app with our wizard, pay, and get your APK automatically built.' },
  { icon: Shield, title: 'Feature-Rich', desc: 'Push notifications, biometric auth, QR scanner, AdMob, and 10+ features.' },
  { icon: Globe, title: 'PWA Support', desc: 'Generate PWA assets for iOS Safari with installable manifest and service worker.' },
]

const steps = [
  { num: '1', title: 'Enter Your URL', desc: 'Paste your website URL and configure basic settings.' },
  { num: '2', title: 'Customize', desc: 'Upload icon, set colors, enable features like push notifications.' },
  { num: '3', title: 'Choose Plan', desc: 'Select from Free, Basic, Pro, or Business plans.' },
  { num: '4', title: 'Get Your App', desc: 'Download APK/AAB built automatically via CI/CD pipeline.' },
]

const testimonials = [
  { name: 'Rahul S.', role: 'Small Business Owner', text: 'Converted my Shopify store to an Android app in 10 minutes. Push notifications increased my repeat customers by 30%.', rating: 5 },
  { name: 'Priya M.', role: 'Freelance Developer', text: 'I use WebToApp for all my clients. The TWA approach means the app looks truly native. Business plan gives me source code too.', rating: 5 },
  { name: 'Alex K.', role: 'Startup Founder', text: 'The free tier let me validate the idea before investing. Upgraded to Pro when we needed push notifications.', rating: 4 },
]

const faqs = [
  { q: 'What is a TWA (Trusted Web Activity)?', a: 'TWA renders your website in Chrome without the address bar, providing a native-like full-screen experience. It requires HTTPS and Digital Asset Links verification.' },
  { q: 'Do I need coding skills?', a: 'No. Our wizard guides you through the entire process. Just paste your website URL and customize visually.' },
  { q: 'What about iOS support?', a: 'We generate PWA (Progressive Web App) assets that make your site installable on iOS Safari. Native iOS app support is not included.' },
  { q: 'Can I publish to Google Play Store?', a: 'Yes. Basic plan and above generate AAB (App Bundle) files that can be uploaded directly to Google Play Console.' },
  { q: 'Is the free plan really free?', a: 'Yes. The free plan generates a basic APK with core features. No credit card required.' },
]

export default function Landing() {
  const { accessToken } = useAuthStore()
  const isLoggedIn = !!accessToken

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-900 text-white py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-6xl font-bold mb-6">
            Convert Any Website Into a<br />Native Android App
          </h1>
          <p className="text-xl lg:text-2xl text-primary-100 mb-8 max-w-3xl mx-auto">
            Turn your website into a feature-rich Android app with TWA technology.
            No coding required. Get your APK in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={isLoggedIn ? '/apps/create' : '/register'} className="bg-white text-primary-700 px-8 py-3 rounded-lg font-semibold text-lg hover:bg-gray-100 flex items-center justify-center gap-2">
              {isLoggedIn ? 'Create New App' : 'Get Started Free'} <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/pricing" className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-white/10">
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
            Everything you need to convert your website into a professional Android app.
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
          <h2 className="text-3xl font-bold text-center mb-12">What Our Users Say</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-gray-50 rounded-xl p-6">
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4">&ldquo;{t.text}&rdquo;</p>
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-gray-500 text-xs">{t.role}</p>
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
            Join thousands of businesses who have converted their websites into Android apps.
          </p>
          <Link to={isLoggedIn ? '/apps/create' : '/register'} className="bg-white text-primary-700 px-8 py-3 rounded-lg font-semibold text-lg hover:bg-gray-100 inline-flex items-center gap-2">
            {isLoggedIn ? 'Create New App' : 'Start Building'} <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
