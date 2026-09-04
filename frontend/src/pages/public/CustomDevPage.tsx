import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Globe, Smartphone, Apple, Monitor, Bot, Sparkles, BrainCircuit, CheckCircle2, Send, Cpu, Database, Zap, ShieldCheck } from 'lucide-react'
import { useSEO } from '@/hooks/useSEO'
import client from '@/api/client'

const PLATFORMS = [
  { id: 'ai-agents', label: 'AI Agents & Business Automation', icon: Bot, desc: 'Autonomous AI agents for customer support, lead qualification, CRM sync, workflow automation, and voice/chat intelligence.' },
  { id: 'ai-integration', label: 'Custom AI & LLM Integration', icon: Sparkles, desc: 'Embed Gemini, OpenAI, Claude, or custom fine-tuned models directly into your existing web, mobile, or enterprise backend systems.' },
  { id: 'web', label: 'Custom Web & SaaS Apps', icon: Globe, desc: 'Full-stack web applications, portals, multi-tenant SaaS, client dashboards, and custom backend API systems.' },
  { id: 'android', label: 'Native Android App', icon: Smartphone, desc: 'High-performance native Android apps — offline sync, device hardware APIs, background services, Google Play ready.' },
  { id: 'ios', label: 'Native iOS App', icon: Apple, desc: 'Native iPhone and iPad applications engineered to Apple Human Interface Guidelines and ready for the App Store.' },
  { id: 'windows', label: 'Windows Desktop Software', icon: Monitor, desc: 'Native Windows desktop software, system tray utilities, offline databases, hardware drivers, and kiosk systems.' },
]

const AI_CAPABILITIES = [
  {
    title: 'Autonomous Business Agents',
    icon: Bot,
    desc: '24/7 intelligent agents that answer customer inquiries, qualify leads, schedule appointments, process orders, and take actions in your tools.',
  },
  {
    title: 'Private Knowledge & RAG Systems',
    icon: Database,
    desc: 'Connect your company documentation, PDFs, product catalogs, and databases to custom vector search for hallucination-free business answers.',
  },
  {
    title: 'Full-Stack Model Integration',
    icon: BrainCircuit,
    desc: 'Production-ready integration of Gemini 1.5/2.0, Claude 3.5, GPT-4o, Whisper audio, and open-source models (Llama 3, DeepSeek) with secure API gateways.',
  },
  {
    title: 'Workflow & Tool Automation',
    icon: Zap,
    desc: 'AI-driven task orchestration that connects with your CRM, payment gateways (Stripe/Razorpay), ERPs, Google Workspace, and internal APIs.',
  },
]

const FAQS = [
  { q: 'Can you migrate or host our apps away from Replit or Google AI Studio?', a: 'Yes. We specialize in taking prototypes and MVPs built on platforms like Replit, Google AI Studio, or V0, and deploying them to reliable, dedicated production infrastructure (Hetzner, AWS, GCP, or DigitalOcean) with automated CI/CD, SSL, database backups, and persistent domain routing.' },
  { q: 'What kind of AI integrations and business agents can you build?', a: 'We build custom AI customer support agents, automated sales and lead qualification bots, document intelligence (RAG over your PDFs/spreadsheets), automated content pipelines, voice AI workflows, and bespoke LLM APIs integrated into your web or mobile apps.' },
  { q: 'How is custom development different from the website-to-app converter?', a: 'The converter wraps your existing website into an app in minutes from $35 one-time. Custom development is for building apps, backends, AI agents, and bespoke software from scratch with full architecture design and dedicated engineering.' },
  { q: 'How much does custom app & AI development cost?', a: 'Cost is based on project scope and deliverables. Small single-purpose integrations or MVPs start in the low hundreds of dollars; larger multi-platform systems with AI agents and custom backends are quoted transparently with a fixed milestone plan.' },
  { q: 'Do I own the full source code and IP?', a: 'Yes, 100%. Upon completion and final payment, all source code, architecture configurations, API integrations, and database schemas belong entirely to you with zero vendor lock-in.' },
]

export default function CustomDevPage() {
  useSEO({
    title: 'Custom App & AI Agent Development — Web, Mobile & Automation',
    description: 'Custom app and AI agent development by WebsiteToApp: autonomous business agents, LLM integrations, custom web apps, and native mobile software.',
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
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-100 text-primary-800 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5 text-primary-600" />
            AI Integration &bull; Custom Web &bull; Native Apps
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Custom App &amp; AI Development</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Need more than a website converter? We build <strong>autonomous AI agents, custom web apps, native Android &amp; iOS apps, and cloud backend systems</strong> tailored to your business goals.
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
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

      {/* AI Agents & Capabilities */}
      <section className="bg-gradient-to-b from-gray-900 to-gray-950 text-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/20 text-primary-300 text-xs font-semibold mb-4 border border-primary-500/30">
              <Bot className="w-3.5 h-3.5" />
              AI For Real-World Business
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">AI Integration &amp; Autonomous Agents</h2>
            <p className="text-gray-300 text-base md:text-lg">
              Empower your business operations with tailor-made AI agents, fine-tuned LLM workflows, and secure private document retrieval.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {AI_CAPABILITIES.map((cap) => (
              <div key={cap.title} className="bg-gray-800/70 border border-gray-700/60 rounded-xl p-6 hover:border-primary-500/50 transition-colors">
                <div className="p-3 bg-primary-900/40 rounded-lg w-fit mb-4 border border-primary-700/40">
                  <cap.icon className="w-6 h-6 text-primary-400" />
                </div>
                <h3 className="font-semibold text-lg text-white mb-2">{cap.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{cap.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 p-5 rounded-xl bg-gray-800/40 border border-gray-700/40 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-300">
              <span className="font-semibold text-white">Have prototypes on Replit or Google AI Studio?</span> We migrate them into scalable, high-performance production apps with persistent databases and custom APIs.
            </div>
            <a href="#enquiry" className="whitespace-nowrap px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold rounded-lg transition-colors">
              Discuss Your AI Project &rarr;
            </a>
          </div>
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
