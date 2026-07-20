import { useParams, Link, Navigate } from 'react-router-dom'
import { useSEO } from '@/hooks/useSEO'
import { blogPosts } from '@/data/blogPosts'
import { Calendar, Clock, ArrowLeft, ArrowRight, BookOpen, ExternalLink } from 'lucide-react'

interface ClusterLink {
  label: string
  href: string
  type: 'platform' | 'comparison' | 'guide' | 'blog'
}

function getClusterLinks(slug: string, category: string): ClusterLink[] {
  const links: ClusterLink[] = []

  // Platform-specific cluster links
  if (/wordpress|woocommerce/.test(slug)) {
    links.push({ label: 'Convert WordPress to App', href: '/convert/wordpress-to-app', type: 'platform' })
    links.push({ label: 'Convert WooCommerce to App', href: '/convert/woocommerce-to-app', type: 'platform' })
  }
  if (/shopify/.test(slug)) {
    links.push({ label: 'Convert Shopify Store to App', href: '/convert/shopify-store-to-app', type: 'platform' })
    links.push({ label: 'Convert WordPress to App', href: '/convert/wordpress-to-app', type: 'platform' })
  }
  if (/react/.test(slug)) {
    links.push({ label: 'Convert React Website to App', href: '/convert/react-website-to-app', type: 'platform' })
    links.push({ label: 'Convert Next.js App to Android', href: '/convert/nextjs-to-app', type: 'platform' })
    links.push({ label: 'Convert Angular to App', href: '/convert/angular-to-app', type: 'platform' })
  }
  if (/angular/.test(slug)) {
    links.push({ label: 'Convert Angular to App', href: '/convert/angular-to-app', type: 'platform' })
    links.push({ label: 'Convert React Website to App', href: '/convert/react-website-to-app', type: 'platform' })
  }
  if (/nextjs|next-js|next\.js/.test(slug)) {
    links.push({ label: 'Convert Next.js App to Android', href: '/convert/nextjs-to-app', type: 'platform' })
    links.push({ label: 'Convert React Website to App', href: '/convert/react-website-to-app', type: 'platform' })
  }
  if (/push.?notif/.test(slug)) {
    links.push({ label: 'Push Notifications Guide', href: '/blog/push-notifications-for-mobile-app', type: 'blog' })
  }
  if (/exe|desktop|windows/.test(slug)) {
    links.push({ label: 'Website to EXE Converter', href: '/convert/website-to-exe', type: 'platform' })
    links.push({ label: 'Website to Windows Desktop App', href: '/blog/website-to-windows-desktop-app', type: 'blog' })
  }
  if (/admob|monetiz/.test(slug)) {
    links.push({ label: 'AdMob Monetization Guide', href: '/blog/monetize-app-with-admob-ads', type: 'blog' })
  }
  if (/play.?store|publish/.test(slug)) {
    links.push({ label: 'Play Store Publishing Guide', href: '/blog/publish-app-on-google-play-store', type: 'guide' })
  }
  if (/cost|price|pricing|paid|free/.test(slug)) {
    links.push({ label: 'App Cost Breakdown', href: '/blog/website-to-app-cost-breakdown-2026', type: 'blog' })
    links.push({ label: 'View Pricing', href: '/pricing', type: 'guide' })
  }
  if (/alternative|vs-|comparison/.test(slug) || category === 'Comparison') {
    links.push({ label: 'vs GoNative', href: '/alternatives/gonative', type: 'comparison' })
    links.push({ label: 'vs WebIntoApp', href: '/alternatives/webintoapp', type: 'comparison' })
    links.push({ label: 'vs Median.co', href: '/alternatives/median', type: 'comparison' })
    links.push({ label: 'vs AppsGeyser', href: '/alternatives/appsgeyser', type: 'comparison' })
  }
  if (/pwa|webview|native/.test(slug)) {
    links.push({ label: 'PWA vs WebView vs Native', href: '/blog/pwa-vs-native-app-vs-webview-app-2026', type: 'blog' })
    links.push({ label: 'WebView vs Native Performance', href: '/blog/webview-vs-native-app-performance', type: 'blog' })
  }

  // Always include these core cluster links (deduplicated)
  const coreLinks: ClusterLink[] = [
    { label: 'Complete Converter Guide', href: '/blog/website-to-app-converter-complete-guide-2026', type: 'guide' },
    { label: 'FAQ — 20 Questions Answered', href: '/blog/website-to-app-faq', type: 'guide' },
    { label: 'Best Converters Compared', href: '/blog/best-website-to-app-converters-2026', type: 'blog' },
  ]
  for (const core of coreLinks) {
    if (!links.some((l) => l.href === core.href)) links.push(core)
  }

  // Deduplicate and exclude the current page
  const seen = new Set<string>()
  return links.filter((l) => {
    if (seen.has(l.href)) return false
    seen.add(l.href)
    return true
  }).slice(0, 8)
}

const clusterBadge: Record<ClusterLink['type'], string> = {
  platform: 'bg-blue-100 text-blue-700',
  comparison: 'bg-purple-100 text-purple-700',
  guide: 'bg-green-100 text-green-700',
  blog: 'bg-gray-100 text-gray-700',
}

const clusterLabel: Record<ClusterLink['type'], string> = {
  platform: 'Convert',
  comparison: 'Compare',
  guide: 'Guide',
  blog: 'Article',
}

const categoryColors: Record<string, string> = {
  Tutorial: 'bg-blue-100 text-blue-800',
  'Feature Guide': 'bg-green-100 text-green-800',
  Comparison: 'bg-purple-100 text-purple-800',
  Business: 'bg-orange-100 text-orange-800',
  Technical: 'bg-gray-100 text-gray-800',
}

function renderMarkdown(md: string): string {
  return md
    // Headings
    .replace(/^### (.+)$/gm, '<h3 class="text-xl font-semibold text-gray-900 mt-8 mb-3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold text-gray-900 mt-10 mb-4">$1</h2>')
    // Bold and italic
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-gray-900">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`(.+?)`/g, '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-sm text-gray-800">$1</code>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary-600 hover:underline">$1</a>')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li class="flex items-start gap-2 text-gray-600"><span class="text-primary-500 mt-1.5 shrink-0">&#8226;</span><span>$1</span></li>')
    // Ordered lists
    .replace(/^(\d+)\. (.+)$/gm, '<li class="flex items-start gap-2 text-gray-600"><span class="font-medium text-gray-500 shrink-0">$1.</span><span>$2</span></li>')
    // Tables
    .replace(/\|(.+)\|\n\|[\-:|]+\|\n((?:\|.+\|\n?)+)/g, (_match, header, body) => {
      const headers = header.split('|').filter(Boolean).map((h: string) => h.trim())
      const rows = body.trim().split('\n').map((row: string) =>
        row.split('|').filter(Boolean).map((c: string) => c.trim())
      )
      return `<div class="overflow-x-auto my-6"><table class="w-full text-sm border-collapse"><thead><tr>${headers.map((h: string) => `<th class="bg-gray-50 px-4 py-3 text-left font-semibold text-gray-900 border-b">${h}</th>`).join('')}</tr></thead><tbody>${rows.map((row: string[]) => `<tr class="border-b">${row.map((c: string) => `<td class="px-4 py-3 text-gray-600">${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`
    })
    // Paragraphs (double newline)
    .replace(/\n\n(?!<)/g, '</p><p class="text-gray-600 leading-relaxed mb-4">')
    // Wrap in paragraph
    .replace(/^(?!<)/, '<p class="text-gray-600 leading-relaxed mb-4">')
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>()
  const post = blogPosts.find((p) => p.slug === slug)

  useSEO({
    title: post?.title || 'Blog',
    description: post?.description,
    canonical: post ? `https://websitetoapp.app/blog/${post.slug}` : undefined,
    ogType: 'article',
  })

  if (!post) return <Navigate to="/blog" replace />

  const currentIndex = blogPosts.findIndex((p) => p.slug === slug)
  const prevPost = currentIndex > 0 ? blogPosts[currentIndex - 1] : null
  const nextPost = currentIndex < blogPosts.length - 1 ? blogPosts[currentIndex + 1] : null

  const sameCat = blogPosts.filter((p) => p.category === post.category && p.slug !== post.slug)
  const crossCat = blogPosts.filter((p) => p.category !== post.category && p.slug !== post.slug)
  const related = [...sameCat, ...crossCat].slice(0, 3)

  const htmlContent = renderMarkdown(post.content.trim())

  return (
    <div>
      {/* Header */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-16">
        <div className="max-w-4xl mx-auto px-4">
          <Link to="/blog" className="inline-flex items-center gap-2 text-primary-200 hover:text-white mb-6 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Blog
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${categoryColors[post.category] || 'bg-white/20 text-white'}`}>
              {post.category}
            </span>
            <span className="text-primary-200 text-sm flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="text-primary-200 text-sm flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {post.readTime}
            </span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold">{post.title}</h1>
          <p className="text-primary-100 text-lg mt-4 max-w-3xl">{post.description}</p>
        </div>
      </section>

      {/* Content */}
      <article className="py-12 max-w-4xl mx-auto px-4">
        {post.videoId && (
          <div className="relative rounded-xl overflow-hidden mb-10" style={{ paddingBottom: '56.25%', height: 0 }}>
            <iframe
              src={`https://www.youtube.com/embed/${post.videoId}`}
              title={post.title}
              loading="lazy"
              allowFullScreen
              className="absolute top-0 left-0 w-full h-full border-0"
            />
          </div>
        )}
        <div
          className="max-w-none"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </article>

      {/* Prev/Next */}
      <section className="border-t max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between gap-4">
          {prevPost ? (
            <Link to={`/blog/${prevPost.slug}`} className="flex-1 group">
              <p className="text-sm text-gray-500 mb-1">&larr; Previous</p>
              <p className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors">{prevPost.title}</p>
            </Link>
          ) : <div className="flex-1" />}
          {nextPost ? (
            <Link to={`/blog/${nextPost.slug}`} className="flex-1 text-right group">
              <p className="text-sm text-gray-500 mb-1">Next &rarr;</p>
              <p className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors">{nextPost.title}</p>
            </Link>
          ) : <div className="flex-1" />}
        </div>
      </section>

      {/* Related Posts */}
      {related.length > 0 && (
        <section className="bg-gray-50 py-12">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Articles</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  to={`/blog/${r.slug}`}
                  className="bg-white border rounded-xl p-6 hover:shadow-lg transition-shadow group"
                >
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColors[r.category] || 'bg-gray-100 text-gray-800'}`}>
                    {r.category}
                  </span>
                  <h3 className="text-lg font-semibold text-gray-900 mt-3 mb-2 group-hover:text-primary-600 transition-colors">
                    {r.title}
                  </h3>
                  <p className="text-gray-600 text-sm">{r.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Content Cluster Hub */}
      {(() => {
        const clusterLinks = getClusterLinks(post.slug, post.category)
        return clusterLinks.length > 0 ? (
          <section className="py-10 bg-gray-50 border-t">
            <div className="max-w-4xl mx-auto px-4">
              <div className="flex items-center gap-2 mb-5">
                <BookOpen className="w-5 h-5 text-primary-600" />
                <h3 className="text-lg font-semibold text-gray-900">More on This Topic</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {clusterLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="flex items-center justify-between gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-primary-300 hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${clusterBadge[link.type]}`}>
                        {clusterLabel[link.type]}
                      </span>
                      <span className="text-sm font-medium text-gray-800 truncate group-hover:text-primary-600 transition-colors">
                        {link.label}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 shrink-0 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all" />
                  </Link>
                ))}
              </div>

              <div className="mt-5 pt-5 border-t border-gray-200 flex flex-wrap gap-4 text-sm">
                <a href="https://indexflow.net" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-gray-500 hover:text-blue-600 transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" /> IndexFlow — Check if your pages are indexed
                </a>
                <Link to="/pricing" className="flex items-center gap-1.5 text-gray-500 hover:text-primary-600 transition-colors">
                  <ArrowRight className="w-3.5 h-3.5" /> View WebsiteToApp Pricing
                </Link>
              </div>
            </div>
          </section>
        ) : null
      })()}

      {/* CTA */}
      <section className="py-16 bg-primary-600 text-white text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">Ready to Build Your App?</h2>
          <p className="text-primary-100 mb-8">
            Convert your website into a professional Android or Windows app. Start free.
          </p>
          <Link to="/register" className="bg-white text-primary-700 px-8 py-3 rounded-lg font-semibold inline-flex items-center gap-2 hover:bg-gray-100">
            Get Started <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
