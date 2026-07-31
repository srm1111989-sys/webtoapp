import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Globe, Smartphone, Apple, Monitor, CheckCircle2, Send } from 'lucide-react'
import { useSEO } from '@/hooks/useSEO'
import client from '@/api/client'

const PLATFORMS = [
  { id: 'web', label: 'Custom Web App', icon: Globe, desc: 'Dashboards, portals, SaaS tools, booking systems — built with modern web stacks and hosted for you.' },
  { id: 'android', label: 'Native Android App', icon: Smartphone, desc: 'True native Android apps — offline features, device APIs, background services, Play-ready.' },
  { id: 'ios', label: 'Native iOS App', icon: Apple, desc: 'Native iPhone/iPad apps built to Apple guidelines, ready for App Store submission.' },
  { id: 'windows', label: 'Windows Desktop App', icon: Monitor, desc: 'Windows desktop software — installers, offline data, hardware integration, kiosk modes.' },
]

const FAQS = [
  { q: 'How is this different from the website-to-app converter?', a: 'The converter wraps your existing website into an app in minutes, from $35 one-time. Custom development is for when you need features a website cannot do — native performance, offline-first data, device hardware, custom backends, or an app built from scratch to your specification.' },
  { q: 'How much does a custom app cost?', a: 'It depends entirely on scope. Small single-purpose apps start in the low hundreds of dollars; full products with backends and multiple platforms cost more. Send your requirement and we reply with a fixed quote — no obligation.' },
  { q: 'Which platforms can you build for?', a: 'Custom web applications, native Android, native iOS, and Windows desktop software — or any combination. One codebase cross-platform builds are also possible where they fit the requirement.' },
  { q: 'How long does a custom project take?', a: 'Typical small projects ship in 1–3 weeks; larger products in 4–8 weeks. You get a timeline with the quote before committing.' },
  { q: 'Do I own the app and the source code?', a: 'Yes. On final payment the app, source code, and all accounts/assets created for the project are yours.' },
]

export default function CustomDevPage() {
  useSEO({
    title: 'Custom App Development — Web, Android, iOS & Windows',
    description: 'Custom app development by the WebsiteToApp team: custom web apps, native Android and iOS apps, and Windows desktop software. Tell us your requirement, get a fixed quote.',
    canonical: 'https://websitetoapp.app/custom-app-development',
  })

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [platforms, setPlatforms] = useState<string[]>([])
  const [details, setDetails] = useState('')
  const [budget, setBudget] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const togglePlatform = (id: string) =>
    setPlatforms((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!details.trim()) { setError('Please describe what you need built.'); return }
    setSending(true)
    setError(null)
    try {
      const chosen = PLATFORMS.filter((p) => platforms.includes(p.id)).map((p) => p.label).join(', ') || 'Not specified'
      await client.post('/api/support', {
        email,
        subject: `Custom app development enquiry — ${chosen}`,
        message: `CUSTOM DEVELOPMENT ENQUIRY\n\nName: ${name || 'Not given'}\nPlatforms: ${chosen}\nBudget: ${budget || 'Not specified'}\n\nRequirement:\n${details}`,
        pageUrl: 'https://websitetoapp.app/custom-app-development',
      })
      setSent(true)
    } catch {
      setError('Could not send your enquiry. Please email support@websitetoapp.app instead.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-primary-50 to-white">
        <div className="max-w-5xl mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Custom App Development</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Need more than a website wrapper? Our team builds <strong>custom web apps, native Android &amp; iOS apps, and Windows desktop software</strong> to your exact requirement — designed, developed, and delivered ready to publish.
          </p>
          <a href="#enquiry" className="inline-block bg-gradient-to-r from-primary-600 to-primary-700 text-white px-8 py-3 rounded-lg font-semibold shadow-lg shadow-primary-200 hover:from-primary-700 hover:to-primary-800 transition-all">
            Tell Us Your Requirement
          </a>
          <p className="text-sm text-gray-500 mt-3">Free fixed quote within 24 hours on business days. No obligation.</p>
        </div>
      </section>

      {/* What we build */}
      <section className="max-w-6xl mx-auto px-4 py-14">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-10">What We Build</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLATFORMS.map((p) => (
            <div key={p.id} className="bg-white border rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="p-3 bg-primary-50 rounded-lg w-fit mb-4">
                <p.icon className="w-7 h-7 text-primary-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{p.label}</h3>
              <p className="text-gray-600 text-sm">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-14">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-10">How It Works</h2>
          <div className="grid sm:grid-cols-4 gap-6 text-center">
            {[
              ['1. Send your requirement', 'Describe what you need in the form below — rough ideas are fine.'],
              ['2. Get a fixed quote', 'We reply within 24 hours with a price, timeline, and any questions.'],
              ['3. We build it', 'Regular progress updates; you review working builds along the way.'],
              ['4. You own everything', 'App, source code, and store listings delivered to you on completion.'],
            ].map(([t, d]) => (
              <div key={t} className="bg-white rounded-xl border p-5">
                <h3 className="font-semibold text-gray-900 mb-2">{t}</h3>
                <p className="text-gray-600 text-sm">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enquiry form */}
      <section id="enquiry" className="max-w-3xl mx-auto px-4 py-14">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-2">Tell Us Your Requirement</h2>
        <p className="text-center text-gray-600 mb-8">We reply with a fixed quote — usually within 24 hours on business days.</p>
        {sent ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Enquiry sent!</h3>
            <p className="text-gray-600">Thanks — we&apos;ve received your requirement and will reply to <strong>{email}</strong> with a quote.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="bg-white border rounded-xl p-6 sm:p-8 space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="Jane Smith" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="you@company.com" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">What do you need? (pick any)</label>
              <div className="grid sm:grid-cols-2 gap-2">
                {PLATFORMS.map((p) => (
                  <label key={p.id} className={`flex items-center gap-2 border rounded-lg px-3 py-2 cursor-pointer transition-colors ${platforms.includes(p.id) ? 'border-primary-500 bg-primary-50' : 'hover:bg-gray-50'}`}>
                    <input type="checkbox" checked={platforms.includes(p.id)} onChange={() => togglePlatform(p.id)} className="accent-primary-600" />
                    <span className="text-sm text-gray-800">{p.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Describe your requirement <span className="text-red-500">*</span></label>
              <textarea required value={details} onChange={(e) => setDetails(e.target.value)} rows={5}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="What should the app do? Who will use it? Any examples or existing systems to integrate with?" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Approximate budget (optional)</label>
              <input type="text" value={budget} onChange={(e) => setBudget(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="e.g. $500–$2,000" />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={sending}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg shadow-primary-200 hover:from-primary-700 hover:to-primary-800 transition-all disabled:opacity-60">
              <Send className="w-4 h-4" /> {sending ? 'Sending…' : 'Send Enquiry'}
            </button>
            <p className="text-xs text-gray-500 text-center">Or email us directly: <a href="mailto:support@websitetoapp.app" className="text-primary-600 hover:underline">support@websitetoapp.app</a></p>
          </form>
        )}
      </section>

      {/* FAQ */}
      <section className="bg-gray-50 py-14">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Custom Development FAQ</h2>
          <div className="space-y-4">
            {FAQS.map((f) => (
              <details key={f.q} className="bg-white border rounded-xl p-5">
                <summary className="font-semibold text-gray-900 cursor-pointer">{f.q}</summary>
                <p className="text-gray-600 mt-2 text-sm leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
          <p className="text-center text-gray-600 mt-8 text-sm">
            Just need your existing website as an app? The <Link to="/pricing" className="text-primary-600 hover:underline">website-to-app converter</Link> does that from $35, one-time.
          </p>
        </div>
      </section>
    </div>
  )
}
