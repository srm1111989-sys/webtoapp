import { useEffect } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { useSEO } from '@/hooks/useSEO'
import { competitors } from '@/data/competitors'
import { blogPosts } from '@/data/blogPosts'
import { ArrowRight, Check, X, AlertCircle, TrendingDown, Zap, Shield, BookOpen } from 'lucide-react'

const COMPARISON_BLOG_MAP: Record<string, string[]> = {
  gonative: ['gonative-alternative', 'best-website-to-app-converters-2026', 'website-to-app-cost-breakdown-2026'],
  webintoapp: ['webintoapp-alternative-websitetoapp', 'best-website-to-app-converters-2026', 'free-vs-paid-website-to-app-converters-2026'],
  median: ['median-co-alternative', 'best-website-to-app-converters-2026', 'website-to-app-cost-breakdown-2026'],
  appsgeyser: ['appsgeyser-alternative', 'free-vs-paid-website-to-app-converters-2026', 'convert-website-to-android-app-free-2026'],
  appmysite: ['best-website-to-app-converters-2026', 'website-to-app-cost-breakdown-2026', 'wordpress-to-android-app-2026'],
}

const VS_SLUG_MAP: Record<string, string> = {
  'website-to-app-vs-gonative': 'gonative',
  'website-to-app-vs-median': 'median',
  'website-to-app-vs-webintoapp': 'webintoapp',
  'website-to-app-vs-appmysite': 'appmysite',
  'website-to-app-vs-appsgeyser': 'appsgeyser',
  'webtoapp-vs-gonative': 'gonative',
  'webtoapp-vs-median': 'median',
  'webtoapp-vs-appmysite': 'appmysite',
}

const WHO_SHOULD_USE: Record<string, { them: string[]; us: string[] }> = {
  gonative: {
    them: ['Development agencies managing 10+ client apps', 'Teams with dedicated JavaScript developers', 'Enterprises needing custom native API integrations', 'White-label app resellers'],
    us: ['Small and medium businesses wanting a fast, affordable app', 'Solopreneurs and bloggers without coding skills', 'WooCommerce and Shopify store owners', 'Anyone who needs a working app in under an hour'],
  },
  webintoapp: {
    them: ['Users who need a very basic Android app with minimal features', 'Developers testing a proof-of-concept on a tight budget'],
    us: ['Anyone who wants push notifications without paying extra', 'Businesses that need AdMob, biometric auth, or offline mode', 'Anyone tired of annual renewal fees', 'Users converting any platform — not just simple websites'],
  },
  median: {
    them: ['Full-stack developers who need deep JS Bridge customization', 'Enterprises with dedicated mobile engineering teams', 'Teams building complex hybrid apps with custom native modules'],
    us: ['Non-developers who want a working app with no coding', 'Cost-conscious businesses that cannot afford $99–$299/month', 'Teams that want 40+ features without writing JavaScript', 'Anyone converting a standard website, blog, or e-commerce store'],
  },
  appsgeyser: {
    them: ['Users who only need a quick prototype or test build', 'Students experimenting with app conversion for the first time'],
    us: ['Anyone publishing to the Google Play Store (needs signed AAB)', 'Businesses that cannot have third-party branding in their app', 'Users who need push notifications or AdMob', 'Anyone who wants a permanent app without monthly fees'],
  },
  appmysite: {
    them: ['WordPress/WooCommerce site owners who prefer a visual dashboard'],
    us: ['Users with non-WordPress sites (React, Shopify, Angular, etc.)', 'Businesses wanting push notifications on the lowest-cost plan', 'Anyone who wants to pay once and never renew', 'Users who need Windows desktop app alongside mobile'],
  },
}

export default function ComparisonPage() {
  const { slug } = useParams<{ slug: string }>()
  const resolvedSlug = slug ? (VS_SLUG_MAP[slug] || slug) : slug
  const competitor = competitors.find((c) => c.slug === resolvedSlug)

  useSEO({
    title: competitor?.seoTitle || 'Alternative',
    description: competitor?.seoDescription,
    canonical: competitor
      ? `https://websitetoapp.app/alternatives/${competitor.slug}`
      : undefined,
  })

  useEffect(() => {
    if (!competitor) return
    const schema = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Article',
          headline: competitor.seoTitle,
          description: competitor.seoDescription,
          author: { '@type': 'Organization', name: 'WebsiteToApp' },
          publisher: { '@type': 'Organization', name: 'WebsiteToApp', url: 'https://websitetoapp.app' },
        },
        {
          // FAQ rich-result eligibility for competitor-brand queries (t127 P1).
          // Answers come from the page's own verdict/pricing data — no new claims.
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: `What is the best ${competitor.name} alternative?`,
              acceptedAnswer: { '@type': 'Answer', text: competitor.verdict },
            },
            {
              '@type': 'Question',
              name: `How much does ${competitor.name} cost compared to WebsiteToApp?`,
              acceptedAnswer: { '@type': 'Answer', text: `${competitor.name}: ${competitor.pricing.detail} WebsiteToApp is a one-time payment from $35 with all 40+ features included and no subscription.` },
            },
            {
              '@type': 'Question',
              name: `Why switch from ${competitor.name} to WebsiteToApp?`,
              acceptedAnswer: { '@type': 'Answer', text: competitor.switchReasons.join(' ') },
            },
          ],
        },
      ],
    }
    let el = document.getElementById('comparison-jsonld')
    if (!el) {
      el = document.createElement('script')
      el.id = 'comparison-jsonld'
      el.setAttribute('type', 'application/ld+json')
      document.head.appendChild(el)
    }
    el.textContent = JSON.stringify(schema)
    return () => { el?.remove() }
  }, [competitor])

  if (!competitor) return <Navigate to="/" replace />

  const otherCompetitors = competitors.filter((c) => c.slug !== slug)

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-700 to-primary-900 text-white py-16">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 text-sm mb-6">
            <TrendingDown className="w-4 h-4" />
            {competitor.name} charges <strong className="ml-1">{competitor.pricing.annualCost}</strong>
          </div>
          <h1 className="text-3xl lg:text-5xl font-bold mb-6">
            The Best {competitor.name} Alternative in 2026
          </h1>
          <p className="text-xl text-primary-100 mb-8 max-w-3xl mx-auto">
            {competitor.name} costs {competitor.pricing.label}. WebsiteToApp gives you the same — and more — for a <strong className="text-white">one-time $35 payment</strong>. No subscriptions. No renewals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-primary-700 px-8 py-4 rounded-lg font-semibold inline-flex items-center justify-center gap-2 hover:bg-gray-100 text-lg"
            >
              Switch to WebsiteToApp — $35 One-Time <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/pricing"
              className="border-2 border-white/30 text-white px-8 py-4 rounded-lg font-semibold inline-flex items-center justify-center gap-2 hover:bg-white/10"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Callout */}
      <section className="py-10 bg-white border-b">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Competitor card */}
            <div className="border-2 border-red-200 rounded-2xl p-6 bg-red-50">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
                <h2 className="text-xl font-bold text-gray-900">{competitor.name}</h2>
              </div>
              <p className="text-3xl font-extrabold text-red-600 mb-1">{competitor.pricing.label}</p>
              <p className="text-sm text-gray-600 mb-4">{competitor.pricing.detail}</p>
              <ul className="space-y-2">
                {competitor.cons.slice(0, 4).map((con) => (
                  <li key={con} className="flex items-start gap-2 text-sm text-gray-600">
                    <X className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    {con}
                  </li>
                ))}
              </ul>
            </div>

            {/* WebsiteToApp card */}
            <div className="border-2 border-green-300 ring-2 ring-green-400 rounded-2xl p-6 bg-green-50 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs px-4 py-1 rounded-full font-semibold">
                Recommended Alternative
              </div>
              <div className="flex items-center gap-3 mb-4">
                <Zap className="w-6 h-6 text-green-600 shrink-0" />
                <h2 className="text-xl font-bold text-gray-900">WebsiteToApp</h2>
              </div>
              <p className="text-3xl font-extrabold text-green-700 mb-1">$35 one-time</p>
              <p className="text-sm text-gray-600 mb-4">
                Pay once. Own forever. All 40+ features included. No subscription, no renewal.
              </p>
              <ul className="space-y-2">
                {competitor.switchReasons.slice(0, 4).map((reason) => (
                  <li key={reason} className="flex items-start gap-2 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            WebsiteToApp vs {competitor.name}: Feature Comparison
          </h2>
          <p className="text-center text-gray-600 mb-10 max-w-2xl mx-auto">
            Side-by-side breakdown of every important feature
          </p>

          <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
            <table className="w-full border-collapse bg-white">
              <thead>
                <tr>
                  <th className="text-left px-5 py-4 text-sm font-semibold text-gray-500 border-b border-gray-100 bg-gray-50">
                    Feature
                  </th>
                  <th className="px-5 py-4 text-center text-sm font-semibold text-red-500 border-b border-gray-100 bg-gray-50">
                    {competitor.name}
                  </th>
                  <th className="px-5 py-4 text-center text-sm font-bold text-primary-700 border-b border-primary-200 bg-primary-50">
                    WebsiteToApp
                  </th>
                </tr>
              </thead>
              <tbody>
                {competitor.features.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="px-5 py-3.5 text-sm font-medium text-gray-900 border-b border-gray-100">
                      {row.name}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-center text-gray-500 border-b border-gray-100">
                      {row.them}
                    </td>
                    <td className={`px-5 py-3.5 text-sm text-center font-semibold border-b border-primary-100 bg-primary-50/50 ${row.usBetter ? 'text-green-700' : 'text-primary-600'}`}>
                      {row.us}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Pros & Cons */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            {competitor.name} — Honest Pros & Cons
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" /> What {competitor.name} does well
              </h3>
              <ul className="space-y-3">
                {competitor.pros.map((pro) => (
                  <li key={pro} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    {pro}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <X className="w-5 h-5 text-red-400" /> Where {competitor.name} falls short
              </h3>
              <ul className="space-y-3">
                {competitor.cons.map((con) => (
                  <li key={con} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg text-sm text-gray-700">
                    <X className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    {con}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Verdict */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-2xl border-2 border-primary-200 p-8 shadow-sm">
            <Shield className="w-8 h-8 text-primary-600 mb-3" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Verdict</h2>
            <p className="text-gray-600 leading-relaxed text-lg">{competitor.verdict}</p>
          </div>
        </div>
      </section>

      {/* Who Should Use Which */}
      {WHO_SHOULD_USE[competitor.slug] && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Who Should Use Which?
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl border-2 border-red-100 p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-3 h-3 bg-red-400 rounded-full" />
                  <h3 className="text-lg font-bold text-gray-900">Use {competitor.name} if…</h3>
                </div>
                <ul className="space-y-3">
                  {WHO_SHOULD_USE[competitor.slug].them.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-gray-700">
                      <Check className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white rounded-2xl border-2 border-green-200 p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <h3 className="text-lg font-bold text-gray-900">Use WebsiteToApp if…</h3>
                </div>
                <ul className="space-y-3">
                  {WHO_SHOULD_USE[competitor.slug].us.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-gray-700">
                      <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 5 Reasons to Switch */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            5 Reasons to Switch from {competitor.name} to WebsiteToApp
          </h2>
          <div className="grid md:grid-cols-1 gap-4 max-w-3xl mx-auto">
            {competitor.switchReasons.map((reason, i) => (
              <div key={i} className="flex items-start gap-4 p-5 bg-primary-50 border border-primary-100 rounded-xl">
                <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                  {i + 1}
                </div>
                <p className="text-gray-800 font-medium">{reason}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Other Comparisons */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            More Comparisons
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            {otherCompetitors.map((c) => (
              <Link
                key={c.slug}
                to={`/alternatives/${c.slug}`}
                className="bg-white border rounded-xl p-5 hover:shadow-md hover:border-primary-300 transition-all"
              >
                <p className="font-semibold text-gray-900 mb-1">WebsiteToApp vs {c.name}</p>
                <p className="text-sm text-gray-500">{c.pricing.label}</p>
                <p className="text-xs text-primary-600 font-medium mt-2">Read comparison →</p>
              </Link>
            ))}
          </div>

          {/* Related Blog Articles */}
          {(() => {
            const slugs = COMPARISON_BLOG_MAP[competitor.slug] || []
            const articles = slugs.map((s) => blogPosts.find((p) => p.slug === s)).filter(Boolean)
            return articles.length > 0 ? (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="w-5 h-5 text-primary-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Related Guides</h3>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  {articles.map((a) => a && (
                    <Link key={a.slug} to={`/blog/${a.slug}`} className="bg-white border border-gray-200 rounded-xl p-4 hover:border-primary-300 hover:shadow-sm transition-all group">
                      <p className="text-xs text-primary-600 font-medium mb-1">{a.category}</p>
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-600 transition-colors leading-snug">{a.title}</p>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null
          })()}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary-600 text-white text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Switch from {competitor.name}?
          </h2>
          <p className="text-primary-100 mb-8 text-lg">
            One-time $35 payment. 40+ features. No subscriptions. 7-day money-back guarantee.
          </p>
          <Link
            to="/register"
            className="bg-white text-primary-700 px-8 py-4 rounded-lg font-semibold inline-flex items-center gap-2 hover:bg-gray-100 text-lg"
          >
            Get Started — $35 One-Time <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-primary-200 text-sm mt-4">No credit card required to start</p>
        </div>
      </section>
    </div>
  )
}
