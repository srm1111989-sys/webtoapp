import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Store, Check, ArrowRight, Loader2, Star, Shield, Clock,
  Upload, Users, ChevronDown, ChevronUp, CheckCircle2, AlertCircle
} from 'lucide-react'
import { useSEO } from '@/hooks/useSEO'
import { createRazorpayOrder, verifyRazorpayPayment } from '@/api/razorpay-proxy'

const STEPS = [
  {
    num: '01',
    title: 'Fill the Form & Pay $50',
    desc: 'Enter your app details and complete the one-time $50 payment. Secure checkout via Razorpay or PayPal.',
  },
  {
    num: '02',
    title: 'Grant Admin / Release Access',
    desc: 'Add our email (sohamsmulay@gmail.com / support@websitetoapp.app) to your Google Play Console as an Admin or Release Manager. Takes 2 minutes.',
  },
  {
    num: '03',
    title: 'We Publish Your App',
    desc: 'Our team handles everything — store listing, app logo & feature graphics, screenshots, metadata, and final submission. Live within 3–5 business days.',
  },
]

const INCLUDES = [
  'Full Google Play Store listing setup',
  'App logo & icon formatting (512x512)',
  'High-res Feature Graphic creation (1024x500)',
  'Store screenshots creation (phone & tablet)',
  'App title, description & keywords optimized',
  'Content rating questionnaire completed (IARC)',
  'Data Safety declarations & privacy policy setup',
  'Final review & submission to Play Store',
  'Post-publish confirmation & support',
]

const FAQS = [
  {
    q: 'Do I need a Google Play Developer account?',
    a: 'Yes, you need an existing Google Play Developer account ($25 one-time fee paid directly to Google). We publish on your behalf — you own the app and account.',
  },
  {
    q: 'How long does publishing take?',
    a: 'Google typically reviews new apps within 1–7 days. Our team submits your app within 24–48 hours after you grant access. Most apps go live within 3–5 business days total.',
  },
  {
    q: 'What APK/AAB file do I need to provide?',
    a: 'You need a signed AAB (Android App Bundle) file. If you used WebsiteToApp\'s paid plan, you already have one. We can also accept signed APKs.',
  },
  {
    q: 'Will my app definitely get approved?',
    a: 'We submit properly signed apps with all required metadata. However, Google Play approval depends on app content. We provide a compliance checklist to maximize approval chances.',
  },
  {
    q: 'Can you also update an existing app?',
    a: 'Yes! We handle both new app submissions and updates to existing published apps for the same $50 flat fee.',
  },
  {
    q: 'What happens after I pay?',
    a: 'Our team contacts you within 24 hours with instructions to add our email to your Play Console. Once granted access, we complete the entire listing, graphics, and submission.',
  },
]

export default function PlayStorePage() {
  useSEO({
    title: 'Publish App on Google Play Store — We Do It For You | $50 Flat',
    description:
      'Struggling with Google Play Store submission? Our experts handle your entire Android app publishing — store listing, logos, banners, screenshots, metadata & submission. One-time $50. Fast & professional.',
    canonical: 'https://websitetoapp.app/publish-app',
  })

  const [form, setForm] = useState({ name: '', email: '', appName: '', websiteUrl: '', appFile: '', notes: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.appName) return
    setLoading(true)
    try {
      const order = await createRazorpayOrder({
        amount: 5000,
        currency: 'USD',
        receipt: `publish_${Date.now()}`,
        notes: {
          name: form.name,
          email: form.email,
          appName: form.appName,
          websiteUrl: form.websiteUrl,
          notes: form.notes,
          service: 'play-store-publish',
        },
      })
      const options = {
        key: order.razorpay_key_id,
        amount: order.amount,
        currency: order.currency,
        name: 'WebsiteToApp',
        description: 'Publish App on Google Play Store',
        order_id: order.razorpay_order_id,
        handler: async (response: any) => {
          try {
            await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })
            setSuccess(true)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          } catch {
            alert('Payment verification failed. Please contact support@websitetoapp.app')
          }
        },
        prefill: { name: form.name, email: form.email },
        theme: { color: '#4f46e5' },
      }
      const rzp = new (window as any).Razorpay(options)
      rzp.open()
    } catch {
      alert('Failed to initiate payment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-b from-indigo-50 to-white py-14 sm:py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-1.5 bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4 uppercase tracking-wider">
            <Store className="w-3.5 h-3.5" /> Play Store Publishing Service
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 mb-5 leading-tight">
            Publish Your Android App on<br className="hidden sm:block" />
            <span className="text-indigo-600"> Google Play Store</span> — We Do It For You
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Skip the confusing Play Console setup. Our experts handle your entire app submission —
            store listing, logos, banners, screenshots, metadata, and publishing. <strong>$50 flat, one-time.</strong>
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {['$50 flat fee', '24h turnaround', '100% ownership', 'Expert team'].map((b) => (
              <span key={b} className="flex items-center gap-1.5 bg-white border border-indigo-200 text-indigo-800 text-sm font-medium px-4 py-2 rounded-full shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-indigo-500" /> {b}
              </span>
            ))}
          </div>
          <a href="#get-started" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-semibold px-8 py-4 rounded-xl shadow-lg transition-all">
            Get Started — $50 <ArrowRight className="w-5 h-5" />
          </a>
          <p className="mt-3 text-sm text-gray-500">One-time payment. No subscription. You keep full ownership.</p>
        </div>
      </section>

      {/* Trust bar */}
      <section className="bg-indigo-600 py-4 px-4">
        <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-6 sm:gap-10">
          {[
            { icon: Star, text: '4.9/5 average rating' },
            { icon: Users, text: '2,400+ apps published' },
            { icon: Clock, text: 'Live within 3–5 days' },
            { icon: Shield, text: 'Secure & confidential' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2 text-white text-sm font-medium">
              <Icon className="w-4 h-4 text-indigo-200" /> {text}
            </div>
          ))}
        </div>
      </section>

      {/* What's Included */}
      <section className="py-14 sm:py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Everything Included for $50</h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              No hidden fees, no upsells. One payment covers your complete Google Play Store submission.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {INCLUDES.map((item) => (
              <div key={item} className="flex items-start gap-3 bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                <Check className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
                <span className="text-sm font-medium text-gray-800">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-14 sm:py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">How It Works</h2>
            <p className="text-gray-600">Three simple steps to get your app live on Google Play Store.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {STEPS.map((step) => (
              <div key={step.num} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm text-center">
                <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">
                  {step.num}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form */}
      <section id="get-started" className="py-14 sm:py-20 px-4 bg-white">
        <div className="max-w-xl mx-auto">
          {success ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <Check className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Payment Successful!</h2>
              <p className="text-gray-600 mb-6">
                Our team will contact <strong>{form.email}</strong> within 24 hours with next steps.
              </p>
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 text-left mb-6">
                <div className="flex gap-3 mb-3">
                  <AlertCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                  <p className="text-sm font-semibold text-indigo-900">Action Required — Grant Play Console Access</p>
                </div>
                <p className="text-sm text-indigo-700 mb-2">
                  Go to your <strong>Google Play Console → Users and permissions → Invite new users</strong> and add:
                </p>
                <p className="text-sm font-bold text-indigo-900 bg-white rounded-lg px-4 py-2.5 border border-indigo-200 text-center tracking-wide">
                  sohamsmulay@gmail.com
                </p>
                <p className="text-xs text-indigo-600 mt-2">Grant <strong>Admin / Release Manager</strong> permissions. This allows us to configure your listing and submit on your behalf.</p>
              </div>
              <Link to="/" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium underline">
                ← Back to Home
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 rounded-full px-4 py-2 mb-4">
                  <Store className="w-5 h-5" />
                  <span className="font-semibold">Submit Your App — $50 One-Time</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Ready to Go Live?</h2>
                <p className="text-gray-600 mt-2">Fill in your details and our team takes it from there.</p>
              </div>

              <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl shadow-lg p-6 sm:p-8 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Your full name"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="you@company.com"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">App Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={form.appName}
                    onChange={(e) => setForm(f => ({ ...f, appName: e.target.value }))}
                    placeholder="e.g. My Store App"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Website / App URL</label>
                  <input
                    type="url"
                    value={form.websiteUrl}
                    onChange={(e) => setForm(f => ({ ...f, websiteUrl: e.target.value }))}
                    placeholder="https://yoursite.com"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Additional Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="App category, target audience, special requirements..."
                    rows={3}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  />
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-800">
                  <p className="font-semibold mb-1">Before you submit:</p>
                  <p>You need an existing <strong>Google Play Developer account</strong> ($25 one-time, paid to Google). We publish on your behalf — you retain full ownership.</p>
                </div>

                <button
                  type="submit"
                  disabled={loading || !form.name || !form.email || !form.appName}
                  className="w-full py-4 rounded-xl font-bold text-white text-base bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Store className="w-5 h-5" /> Pay $50 & Submit</>}
                </button>
                <p className="text-center text-xs text-gray-500">Secure payment via Razorpay / PayPal · 100% money-back if we can't publish</p>
              </form>
            </>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-14 sm:py-20 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Frequently Asked Questions</h2>
            <p className="text-gray-600">Everything you need to know about our Play Store publishing service.</p>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                >
                  <span className="font-semibold text-gray-900 text-sm sm:text-base">{faq.q}</span>
                  {openFaq === i ? <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-sm text-gray-600 border-t border-gray-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-14 sm:py-20 px-4 bg-indigo-600">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Ready to Publish Your App?
          </h2>
          <p className="text-indigo-200 mb-8">
            Join thousands of app owners who skipped the hassle. $50 flat, one-time.
          </p>
          <a
            href="#get-started"
            className="inline-flex items-center gap-2 bg-white text-indigo-700 font-bold text-lg px-8 py-4 rounded-xl shadow-lg hover:bg-indigo-50 transition-all"
          >
            Get Started Now <ArrowRight className="w-5 h-5" />
          </a>
          <p className="mt-4 text-indigo-300 text-sm">
            Questions? Email <a href="mailto:support@websitetoapp.app" className="underline text-white">support@websitetoapp.app</a>
          </p>
        </div>
      </section>
    </div>
  )
}
