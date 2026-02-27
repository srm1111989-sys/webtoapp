# Integration Guide - Python + React Date-Based Publishing

**Your existing stack:** FastAPI (Python) + React (Vite)

---

## ✅ What Was Created

### Backend (FastAPI):
1. ✅ `backend/app/routers/blog.py` - Blog API with date-based publishing
2. ✅ `backend/app/routers/seo.py` - Dynamic sitemap.xml & robots.txt
3. ✅ Updated `backend/app/main.py` - Added blog & seo routers

### Frontend (React):
- Will update existing Blog.tsx & BlogPost.tsx to fetch from new API

---

## 🚀 Quick Deployment (5 Steps)

### Step 1: Backend is Ready ✅

The routers are already created. Just restart your backend:

```bash
cd backend
python -m app.main
```

**Test API:**
```bash
# Get published posts
curl http://localhost:8000/api/blog/posts

# Get sitemap
curl http://localhost:8000/sitemap.xml

# Get robots.txt
curl http://localhost:8000/robots.txt
```

---

### Step 2: Update Frontend Blog Component

Replace `frontend/src/pages/public/Blog.tsx` with this:

```tsx
import { Link } from 'react-router-dom'
import { useSEO } from '@/hooks/useSEO'
import { Calendar, Clock, ArrowRight, BookOpen } from 'lucide-react'
import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const categoryColors: Record<string, string> = {
  Tutorial: 'bg-blue-100 text-blue-800',
  'Feature Guide': 'bg-green-100 text-green-800',
  Comparison: 'bg-purple-100 text-purple-800',
  Business: 'bg-orange-100 text-orange-800',
  Technical: 'bg-gray-100 text-gray-800',
  Guides: 'bg-blue-100 text-blue-800',
  WordPress: 'bg-purple-100 text-purple-800',
  eCommerce: 'bg-green-100 text-green-800',
  Pricing: 'bg-orange-100 text-orange-800',
}

interface BlogPost {
  slug: string
  title: string
  publish_date: string
  category: string
  url: string
}

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  useSEO({
    title: 'Blog - Guides, Tutorials & Tips',
    description: 'Learn how to convert websites into Android and Windows apps.',
  })

  useEffect(() => {
    // Fetch published posts from API
    axios.get(`${API_URL}/api/blog/posts`)
      .then(res => {
        setPosts(res.data.posts)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load blog posts:', err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <div className="py-20 text-center">Loading...</div>
  }

  if (posts.length === 0) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-2xl font-bold">No posts published yet</h2>
        <p className="text-gray-600 mt-2">Check back soon for new content!</p>
      </div>
    )
  }

  const featured = posts[0]
  const rest = posts.slice(1)

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">WebToApp Blog</h1>
          <p className="text-primary-100 text-lg max-w-2xl mx-auto">
            Guides, tutorials, and tips for converting websites into mobile apps.
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
                  {new Date(featured.publish_date).toLocaleDateString()}
                </span>
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors">
                {featured.title}
              </h2>
              <span className="text-primary-600 font-medium text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                Read article <ArrowRight className="w-4 h-4" />
              </span>
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
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                {post.title}
              </h3>
              <div className="flex items-center justify-between mt-auto">
                <span className="text-xs text-gray-400">
                  {new Date(post.publish_date).toLocaleDateString()}
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
            Convert your website into an Android or Windows app in minutes.
          </p>
          <Link to="/register" className="bg-white text-primary-700 px-8 py-3 rounded-lg font-semibold inline-flex items-center gap-2 hover:bg-gray-100">
            Get Started Free <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
```

---

### Step 3: Update BlogPost Component

Update `frontend/src/pages/public/BlogPost.tsx`:

```tsx
import { useParams, Link } from 'react-router-dom'
import { useSEO } from '@/hooks/useSEO'
import { ArrowLeft } from 'lucide-react'
import { useState, useEffect } from 'react'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function BlogPost() {
  const { slug } = useParams()
  const [post, setPost] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return

    axios.get(`${API_URL}/api/blog/posts/${slug}`)
      .then(res => {
        setPost(res.data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.response?.data?.detail || 'Post not found')
        setLoading(false)
      })
  }, [slug])

  useSEO({
    title: post?.title || 'Blog Post',
    description: post?.meta_description || '',
  })

  if (loading) {
    return <div className="py-20 text-center">Loading...</div>
  }

  if (error) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Content Not Available</h2>
        <p className="text-gray-600 mb-8">{error}</p>
        <Link to="/blog" className="text-primary-600 hover:text-primary-700 font-medium flex items-center justify-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Blog
        </Link>
      </div>
    )
  }

  return (
    <article className="py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back button */}
        <Link to="/blog" className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-2 mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Blog
        </Link>

        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm px-3 py-1 bg-primary-100 text-primary-700 rounded-full font-medium">
              {post.category}
            </span>
            <span className="text-sm text-gray-500">
              {new Date(post.publish_date).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            {post.title}
          </h1>
          {post.meta_description && (
            <p className="text-xl text-gray-600">{post.meta_description}</p>
          )}
        </header>

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </div>

        {/* CTA */}
        <div className="mt-16 p-8 bg-gradient-to-br from-primary-50 to-blue-50 rounded-2xl text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Ready to Convert Your Website?</h3>
          <p className="text-gray-600 mb-6">Start building your mobile app today</p>
          <Link
            to="/register"
            className="inline-block bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
          >
            Get Started Free
          </Link>
        </div>
      </div>
    </article>
  )
}
```

---

### Step 4: Deploy

```bash
# 1. Restart backend
cd backend
python -m uvicorn app.main:app --reload

# 2. Restart frontend
cd ../frontend
npm run dev

# 3. Or deploy with Docker
docker-compose up --build
```

---

### Step 5: Test Date-Based Publishing

**Test URLs:**

```bash
# Get all published posts (only shows if current_date >= publish_date)
curl http://localhost:8000/api/blog/posts

# Try accessing future content (should get 404)
curl http://localhost:8000/api/blog/posts/future-post-slug

# Get sitemap (only includes published content)
curl http://localhost:8000/sitemap.xml

# Check schedule (shows all content + publish status)
curl http://localhost:8000/api/blog/schedule
```

**Frontend:**
- Visit: http://localhost:5173/blog
- Should show only published posts
- Click on a post - should load full content
- Try accessing future post URL - should show "not available" message

---

## 📋 How It Works

### Date-Based Publishing:

```python
# In blog.py
def is_published(publish_date_str: str) -> bool:
    publish_date = datetime.strptime(publish_date_str, "%Y-%m-%d").date()
    today = date.today()
    return today >= publish_date  # Only shows if today >= publish date
```

**Example:**
- Today: March 1, 2026
- Post publish date: March 3, 2026
- `is_published()` returns `False` → API returns 404
- User can't access future content

**On March 3:**
- `is_published()` returns `True` → API returns content
- Post automatically becomes visible

---

## 🔧 Adding New Content

### Option 1: Update CONTENT_SCHEDULE manually

Edit `backend/app/routers/blog.py`:

```python
CONTENT_SCHEDULE = {
    # ... existing content ...

    # Add Week 2
    "turn-website-into-mobile-app": {
        "slug": "turn-website-into-mobile-app",
        "title": "Turn Website Into Mobile App (Complete Guide)",
        "publish_date": "2026-03-06",  # March 6
        "category": "Guides",
        "url": "/blog/turn-website-into-mobile-app",
    },
    # Add more...
}
```

**Restart backend** - new content auto-shows on March 6!

---

### Option 2: Use Python Script

```bash
python automation/auto_publish.py --week 2
```

This:
1. Generates Week 2 content with Claude
2. Updates CONTENT_SCHEDULE automatically
3. Commits to git
4. Redeploy and content is scheduled

---

## 📊 Production Deployment

### Update docker-compose.yml:

Already configured! Just ensure:

```yaml
backend:
  volumes:
    - ./generated-content:/app/generated-content:ro  # Mount content
```

### Deploy:

```bash
# Build and deploy
docker-compose -f docker-compose.yml up --build -d

# Check logs
docker-compose logs -f backend
```

---

## ✅ Testing Checklist

- [ ] Backend starts without errors
- [ ] `/api/blog/posts` returns published posts only
- [ ] `/api/blog/posts/{slug}` returns content if published
- [ ] `/api/blog/posts/{slug}` returns 404 if future date
- [ ] `/sitemap.xml` includes only published content
- [ ] `/robots.txt` is generated correctly
- [ ] Frontend blog page loads published posts
- [ ] Frontend blog post page shows content
- [ ] Trying to access future post shows error message
- [ ] `/api/blog/schedule` shows all content with status

---

## 🎯 Current Schedule (Week 1)

Based on your generated content:

| Date | Slug | Status |
|------|------|--------|
| Mar 1 | pricing | ⏳ Scheduled |
| Mar 2 | convert-website-to-android-app | ⏳ Scheduled |
| Mar 3 | wordpress-to-android-app | ⏳ Scheduled |
| Mar 4 | shopify-to-mobile-app | ⏳ Scheduled |

**Today:** Feb 27, 2026
**First publish:** March 1 (in 3 days)

---

## 💡 Quick Commands

```bash
# Check what's published today
curl http://localhost:8000/api/blog/schedule | jq '.published'

# Get sitemap
curl http://localhost:8000/sitemap.xml

# Get specific post
curl http://localhost:8000/api/blog/posts/convert-website-to-android-app

# Restart backend
cd backend && uvicorn app.main:app --reload

# Frontend dev
cd frontend && npm run dev

# Full deployment
docker-compose up --build
```

---

## 🐛 Troubleshooting

**Posts not showing:**
- Check current date vs publish_date
- Verify `generated-content/week-01/` has markdown files
- Check backend logs for errors

**404 errors:**
- Content might not be published yet
- Check CONTENT_SCHEDULE has correct slug
- Verify markdown file exists

**Sitemap empty:**
- All content is future-dated
- Check dates in CONTENT_SCHEDULE

---

**You're ready! 🚀**

Everything is set up for date-based publishing in your existing Python + React app.

**Next:** Deploy to server and content will auto-publish on scheduled dates!
