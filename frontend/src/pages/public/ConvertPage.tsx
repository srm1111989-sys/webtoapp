import { useParams, useLocation, Link, Navigate } from 'react-router-dom'
import { useSEO } from '@/hooks/useSEO'
import { platforms } from '@/data/platforms'
import { blogPosts } from '@/data/blogPosts'
import { ArrowRight, CheckCircle, HelpCircle, Zap, Shield, Smartphone, BookOpen } from 'lucide-react'

function getRelatedArticles(slug: string) {
  const keywords = slug.split('-').filter((w) => w.length > 3)
  return blogPosts
    .filter((p) => keywords.some((kw) => p.slug.includes(kw) || p.title.toLowerCase().includes(kw)))
    .slice(0, 3)
}

const SLUG_ALIASES: Record<string, string> = {
  'wordpress-website': 'wordpress',
  'angular-website': 'angular',
  'nextjs-website': 'nextjs',
  'react-app': 'react-website',
  'vue-website': 'vue',
  'shopify-website': 'shopify-store',
}

export default function ConvertPage() {
  const { slug: rawSlug } = useParams<{ slug: string }>()
  const location = useLocation()
  // Handle both /convert/:slug and /convert-:slug URL patterns
  const effectiveSlug = rawSlug || location.pathname.replace(/^\/convert-/, '')
  const stripped = effectiveSlug.replace(/-(to-app|to-android-app)$/, '')
  const cleanSlug = SLUG_ALIASES[stripped] || stripped
  const platform = platforms.find((p) => p.slug === cleanSlug)

  useSEO({
    title: platform
      ? `Convert ${platform.displayName} Website to App - No Coding Required`
      : 'Convert Website to App',
    description: platform?.description,
    canonical: platform
      ? `https://websitetoapp.app/convert/${cleanSlug}-to-app`
      : undefined,
  })

  if (!platform) return <Navigate to="/" replace />

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: platform.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }

  return (
    <div>
      {/* FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold mb-6">
            Convert {platform.displayName} Website to Android App
          </h1>
          <p className="text-xl text-primary-100 mb-8 max-w-3xl mx-auto">
            {platform.description}. No coding required. Get your app ready for Google Play in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-primary-700 px-8 py-4 rounded-lg font-semibold inline-flex items-center justify-center gap-2 hover:bg-gray-100 text-lg"
            >
              Convert Your {platform.displayName} Site <ArrowRight className="w-5 h-5" />
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

      {/* How it Works */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How to Convert {platform.displayName} to App in 3 Steps
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Enter Your URL', desc: `Paste your ${platform.displayName} website URL into WebsiteToApp`, icon: Zap },
              { step: '2', title: 'Customize Your App', desc: 'Set your app name, icon, splash screen, and enable features', icon: Smartphone },
              { step: '3', title: 'Build & Download', desc: 'Get your APK/AAB file ready for Google Play Store', icon: Shield },
            ].map((item) => (
              <div key={item.step} className="text-center p-6">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-8 h-8 text-primary-600" />
                </div>
                <div className="text-sm font-bold text-primary-600 mb-2">STEP {item.step}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            {platform.displayName} App Features
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Everything you need to turn your {platform.displayName} website into a fully functional mobile app.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {platform.features.map((feature) => (
              <div key={feature} className="flex items-start gap-3 bg-white p-4 rounded-lg border">
                <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Why Convert {platform.displayName} to a Mobile App?
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            A mobile app gives your {platform.displayName} site superpowers that a website alone can't match.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {platform.benefits.map((benefit) => (
              <div key={benefit} className="bg-primary-50 p-6 rounded-xl">
                <Zap className="w-6 h-6 text-primary-600 mb-3" />
                <p className="text-gray-800 font-medium">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            <HelpCircle className="w-8 h-8 inline-block mr-2 text-primary-600" />
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {platform.faqs.map((faq, i) => (
              <details key={i} className="bg-white border rounded-xl p-6 group" open={i === 0}>
                <summary className="font-semibold text-gray-900 cursor-pointer list-none flex justify-between items-center">
                  {faq.question}
                  <span className="text-primary-500 group-open:rotate-45 transition-transform text-2xl">+</span>
                </summary>
                <p className="text-gray-600 mt-4 leading-relaxed">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Other Platforms */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Also Convert These Platforms
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {platforms
              .filter((p) => p.slug !== platform.slug)
              .map((p) => (
                <Link
                  key={p.slug}
                  to={`/convert/${p.slug}-to-app`}
                  className="text-center p-4 border rounded-xl hover:shadow-md hover:border-primary-300 transition-all"
                >
                  <p className="font-semibold text-gray-900">{p.displayName}</p>
                  <p className="text-sm text-gray-500 mt-1">to App</p>
                </Link>
              ))}
          </div>
        </div>
      </section>

      {/* Related Articles */}
      {(() => {
        const articles = getRelatedArticles(platform.slug)
        return articles.length > 0 ? (
          <section className="py-12 bg-gray-50">
            <div className="max-w-5xl mx-auto px-4">
              <div className="flex items-center gap-2 mb-6">
                <BookOpen className="w-5 h-5 text-primary-600" />
                <h3 className="text-xl font-bold text-gray-900">Related Guides</h3>
              </div>
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                {articles.map((a) => (
                  <Link key={a.slug} to={`/blog/${a.slug}`} className="bg-white border border-gray-200 rounded-xl p-5 hover:border-primary-300 hover:shadow-md transition-all group">
                    <p className="text-xs font-medium text-primary-600 mb-2">{a.category} · {a.readTime}</p>
                    <h4 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors text-sm leading-snug">{a.title}</h4>
                  </Link>
                ))}
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                <Link to="/blog" className="hover:text-primary-600">All articles →</Link>
                <Link to="/pricing" className="hover:text-primary-600">View pricing →</Link>
                <Link to="/features" className="hover:text-primary-600">All features →</Link>
                <Link to="/blog/website-to-app-faq" className="hover:text-primary-600">FAQ →</Link>
              </div>
            </div>
          </section>
        ) : (
          <section className="py-8 bg-gray-50">
            <div className="max-w-5xl mx-auto px-4 flex flex-wrap gap-4 text-sm text-gray-500">
              <Link to="/blog" className="hover:text-primary-600">All articles →</Link>
              <Link to="/pricing" className="hover:text-primary-600">View pricing →</Link>
              <Link to="/blog/website-to-app-faq" className="hover:text-primary-600">FAQ →</Link>
            </div>
          </section>
        )
      })()}

      {/* CTA */}
      <section className="py-16 bg-primary-600 text-white text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Convert Your {platform.displayName} Site?
          </h2>
          <p className="text-primary-100 mb-8 text-lg">
            Join thousands of businesses who converted their website to a mobile app. Start free, no credit card required.
          </p>
          <Link
            to="/register"
            className="bg-white text-primary-700 px-8 py-4 rounded-lg font-semibold inline-flex items-center gap-2 hover:bg-gray-100 text-lg"
          >
            Get Started Free <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
