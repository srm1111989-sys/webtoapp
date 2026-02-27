# Enable Date-Based Publishing - Quick Guide

**Your setup:** FastAPI (Python) + React (Vite)
**Goal:** Auto-show blog content based on publish dates

---

## ✅ Files Created (Ready to Use)

1. `backend/app/routers/blog.py` - Blog API with date logic
2. `backend/app/routers/seo.py` - Sitemap & robots.txt
3. `backend/app/main.py` - Updated with new routers
4. Sample React components in INTEGRATION_GUIDE.md

---

## 🚀 Quickest Way to Enable (2 Minutes)

### Step 1: Restart Your Backend

```bash
cd C:\Projects\Projects-2026\webtoapp\backend
python -m uvicorn app.main:app --reload
```

**That's it!** The blog API is now live with date-based publishing.

---

### Step 2: Test It Works

Open browser or curl:

```bash
# Check published posts (only shows if current_date >= publish_date)
curl http://localhost:8000/api/blog/posts

# Check schedule (shows all content with status)
curl http://localhost:8000/api/blog/schedule

# Get sitemap (only published content)
curl http://localhost:8000/sitemap.xml
```

**Expected result:**
- `api/blog/posts` returns empty (no content published yet - first publish is Mar 1)
- `/api/blog/schedule` shows 4 posts (all scheduled for Mar 1-4)

---

### Step 3: Test Future Content is Hidden

```bash
# Try to access content scheduled for March 2
curl http://localhost:8000/api/blog/posts/convert-website-to-android-app

# Should return:
# {"detail": "This content will be available on 2026-03-02"}
```

✅ Perfect! Date-based publishing is working.

---

## 📅 What Happens Automatically

### March 1, 2026:
- Pricing comparison page becomes visible
- `/api/blog/posts` returns 1 post
- Sitemap includes pricing page

### March 2, 2026:
- "Convert Website to Android App" becomes visible
- `/api/blog/posts` returns 2 posts
- Sitemap includes both pages

### March 3-4, 2026:
- WordPress and Shopify posts become visible
- All 4 posts shown in blog

**No manual work needed - it's automatic!**

---

## 🔧 How to Add More Content

### Quick: Update Schedule Manually

Edit `backend/app/routers/blog.py`:

```python
CONTENT_SCHEDULE = {
    # Week 1 (existing)
    "pricing": {...},
    "convert-website-to-android-app": {...},

    # Add Week 2
    "turn-website-into-mobile-app": {
        "slug": "turn-website-into-mobile-app",
        "title": "Turn Website Into Mobile App",
        "publish_date": "2026-03-06",  # Auto-publishes March 6!
        "category": "Guides",
        "url": "/blog/turn-website-into-mobile-app",
    },
}
```

**Restart backend** → Content auto-publishes on March 6!

---

### Advanced: Generate with Python Script

```bash
cd C:\Projects\Projects-2026\webtoapp

# Generate Week 2 content
python automation/auto_publish.py --week 2

# This creates:
# - 5 blog posts in generated-content/week-02/
# - Updates CONTENT_SCHEDULE automatically
# - All scheduled for March 6-12
```

---

## 🌐 Update Frontend (Optional - If You Want React Pages)

Your frontend already has Blog components. Update them to use new API:

**See:** `INTEGRATION_GUIDE.md` for full React code

**Quick version:**

```tsx
// In frontend/src/pages/public/Blog.tsx
const [posts, setPosts] = useState([])

useEffect(() => {
  axios.get('http://localhost:8000/api/blog/posts')
    .then(res => setPosts(res.data.posts))
}, [])

// Now blog page shows only published content!
```

---

## 🚢 Deploy to Production

### Option 1: Docker (Current Setup)

```bash
# Your docker-compose.yml already configured
docker-compose up --build -d

# Logs
docker-compose logs -f backend
```

### Option 2: Direct Server

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Frontend
cd frontend
npm run build
# Serve dist/ with nginx
```

### Option 3: Quick Deploy Script

```bash
chmod +x deploy-blog.sh
./deploy-blog.sh
```

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] `http://yourserver.com/api/blog/posts` returns published posts
- [ ] `http://yourserver.com/api/blog/schedule` shows all content
- [ ] `http://yourserver.com/sitemap.xml` includes only published pages
- [ ] `http://yourserver.com/robots.txt` is generated
- [ ] Accessing future content returns 404/error
- [ ] On publish date, content becomes visible automatically

---

## 📊 Current Status

**Today:** February 27, 2026

**Content Schedule:**
| Date | Content | Status |
|------|---------|--------|
| Mar 1 | Pricing page | ⏳ 3 days |
| Mar 2 | Convert Website | ⏳ 4 days |
| Mar 3 | WordPress | ⏳ 5 days |
| Mar 4 | Shopify | ⏳ 6 days |

**API Status:**
- ✅ Blog router active
- ✅ SEO routes active
- ⏳ Content scheduled
- ⏳ Waiting for publish dates

---

## 🐛 Common Issues

### "Module 'blog' not found"

**Solution:** Restart backend:
```bash
cd backend
python -m uvicorn app.main:app --reload
```

### "API returns empty"

**Solution:** That's correct! Content isn't published yet (first publish is Mar 1).

Check schedule instead:
```bash
curl http://localhost:8000/api/blog/schedule
```

### "Sitemap is empty"

**Solution:** All content is future-dated. Sitemap only shows published content.

Wait until March 1 or manually change a publish_date to test.

---

## 💡 Quick Test (Change Dates)

Want to test NOW instead of waiting until March?

Edit `backend/app/routers/blog.py`:

```python
CONTENT_SCHEDULE = {
    "pricing": {
        "publish_date": "2026-02-27",  # Changed to today!
        # ... rest
    }
}
```

Restart backend → Content is now published!

---

## 🎯 Summary

**What you have now:**
- ✅ Date-based publishing API (Python/FastAPI)
- ✅ Dynamic sitemap.xml
- ✅ Dynamic robots.txt
- ✅ 4 blog posts scheduled (Mar 1-4)
- ✅ Auto-publish on schedule dates

**What you need to do:**
1. Restart backend (1 command)
2. Deploy to server (docker-compose up)
3. Wait for March 1 (or test with changed dates)
4. Content auto-publishes!

**Time to enable:** 2 minutes
**Maintenance:** Zero (automatic)

---

## 📞 Quick Commands

```bash
# Start backend
cd backend && python -m uvicorn app.main:app --reload

# Check published posts
curl http://localhost:8000/api/blog/posts

# Check schedule
curl http://localhost:8000/api/blog/schedule

# View sitemap
curl http://localhost:8000/sitemap.xml

# Deploy with Docker
docker-compose up -d

# Check logs
docker-compose logs -f backend
```

---

**You're ready! Just restart your backend and it's enabled.** 🚀

The blog system will automatically publish content on scheduled dates without any manual intervention.

**Next:** Deploy to server → Wait for March 1 → Content auto-appears!
