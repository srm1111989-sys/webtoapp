import { Link } from 'react-router-dom'
import { useSEO } from '@/hooks/useSEO'
import { blogPosts } from '@/data/blogPosts'
import { Calendar, Clock, ArrowRight, BookOpen } from 'lucide-react'

const categoryColors: Record<string, string> = {
  Tutorial: 'bg-blue-100 text-blue-800',
  'Feature Guide': 'bg-green-100 text-green-800',
  Comparison: 'bg-purple-100 text-purple-800',
  Business: 'bg-orange-100 text-orange-800',
  Technical: 'bg-gray-100 text-gray-800',
}

export default function Blog() {
  useSEO({
    title: 'Blog - Guides, Tutorials & Tips',
    description: 'Learn how to convert websites into Android and Windows apps. Tutorials on push notifications, AdMob, app store publishing, offline mode, and more.',
    canonical: 'https://websitetoapp.app/blog',
  })

  const featured = blogPosts[0]
  const rest = blogPosts.slice(1)

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">WebsiteToApp Blog</h1>
          <p className="text-primary-100 text-lg max-w-2xl mx-auto">
            Guides, tutorials, and tips for converting websites into mobile and desktop apps.
          </p>
        </div>
      </section>

      {/* Featured Post */}
      <section className="py-12 max-w-7xl mx-auto px-4">
        <Link
          to={`/blog/${featured.slug}`}
          className="block bg-white border rounded-xl p-8 hover:shadow-lg transition-shadow group"
        >
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${categoryColors[featured.category] || 'bg-gray-100 text-gray-800'}`}>
                  {featured.category}
                </span>
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(featured.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors">
                {featured.title}
              </h2>
              <p className="text-gray-600 mb-4 text-lg">{featured.description}</p>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {featured.readTime}
                </span>
                <span className="text-primary-600 font-medium text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                  Read article <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>
            <div className="lg:w-80 shrink-0 bg-gradient-to-br from-primary-50 to-blue-50 rounded-xl flex items-center justify-center p-8">
              <BookOpen className="w-20 h-20 text-primary-300" />
            </div>
          </div>
        </Link>
      </section>

      {/* All Posts Grid */}
      <section className="pb-20 max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">All Articles</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rest.map((post) => (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              className="bg-white border rounded-xl p-6 hover:shadow-lg transition-shadow group flex flex-col"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColors[post.category] || 'bg-gray-100 text-gray-800'}`}>
                  {post.category}
                </span>
                <span className="text-xs text-gray-400">{post.readTime}</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                {post.title}
              </h3>
              <p className="text-gray-600 text-sm flex-1 mb-4">{post.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <span className="text-primary-600 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                  Read <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary-600 text-white text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">Ready to Build Your App?</h2>
          <p className="text-primary-100 mb-8 text-lg">
            Convert your website into an Android or Windows app in minutes. No coding required.
          </p>
          <Link to="/register" className="bg-white text-primary-700 px-8 py-3 rounded-lg font-semibold inline-flex items-center gap-2 hover:bg-gray-100">
            Get Started Free <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
