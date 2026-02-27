# WebsiteToApp Automation System

Complete automation for your 90-day SEO campaign. Automatically publish content based on schedules, update sitemaps, and handle routing.

---

## 🎯 What This Does

1. **Date-Based Routing** - Content only shows when `current_date >= publish_date`
2. **Dynamic Sitemap** - Auto-generates sitemap with only published content
3. **Dynamic Robots.txt** - Auto-generates robots.txt
4. **Automated Publishing** - Python script + GitHub Actions for hands-free operation

---

## 📁 Files Overview

```
automation/
├── next-middleware.js          # Date-based routing (Next.js)
├── sitemap-generator.js        # Dynamic sitemap generator
├── robots-generator.js         # Dynamic robots.txt generator
├── auto_publish.py             # Python automation script
├── github-actions-workflow.yml # CI/CD automation
└── README.md                   # This file
```

---

## 🚀 Quick Start

### Option 1: Next.js (Recommended)

**1. Copy files to your Next.js project:**

```bash
# Middleware (handles date-based routing)
cp automation/next-middleware.js your-nextjs-project/middleware.js

# Sitemap
cp automation/sitemap-generator.js your-nextjs-project/app/sitemap.xml/route.js

# Robots.txt
cp automation/robots-generator.js your-nextjs-project/app/robots.txt/route.js
```

**2. Deploy to Vercel:**

```bash
vercel deploy
```

**That's it!** The middleware will automatically:
- Show content only when published
- Generate sitemap with published content
- Generate robots.txt dynamically

**3. Update content schedule:**

Edit `middleware.js` to add new content:

```javascript
const CONTENT_SCHEDULE = {
  '/blog/your-new-post': '2026-03-15',  // Shows on March 15
  // Add more...
};
```

Redeploy and it's live!

---

### Option 2: Python Automation (CLI)

**1. Install dependencies:**

```bash
pip install anthropic
```

**2. Set API key:**

```bash
export CLAUDE_API_KEY=your_api_key_here
```

**3. Generate content for a week:**

```bash
python automation/auto_publish.py --week 2
```

This will:
- ✅ Generate all 5 blog posts for Week 2 using Claude
- ✅ Save to `generated-content/week-02/`
- ✅ Update `middleware.js` with new content schedule
- ✅ Update `sitemap-generator.js`
- ✅ Commit to git
- ✅ Push to remote

**4. Check publishing schedule:**

```bash
python automation/auto_publish.py --schedule
```

---

### Option 3: GitHub Actions (Fully Automated)

**1. Add GitHub secrets:**

Go to GitHub repo → Settings → Secrets and add:
- `CLAUDE_API_KEY` - Your Claude API key
- `VERCEL_TOKEN` - Your Vercel token (if using Vercel)

**2. Copy workflow file:**

```bash
cp automation/github-actions-workflow.yml .github/workflows/auto-publish.yml
```

**3. Commit and push:**

```bash
git add .github/workflows/auto-publish.yml
git commit -m "Add auto-publish workflow"
git push
```

**4. Sit back and relax! 🎉**

The workflow will:
- Run daily at 8 AM UTC
- Check if content is scheduled for today
- Auto-publish if needed
- Regenerate sitemap
- Deploy to Vercel

---

## 📋 How It Works

### Date-Based Routing

**Middleware checks every request:**

```javascript
const publishDate = CONTENT_SCHEDULE['/blog/my-post'];  // '2026-03-15'
const today = new Date().toISOString().split('T')[0];   // '2026-03-10'

if (today < publishDate) {
  return NextResponse.redirect('/coming-soon');  // Not published yet
}
```

**Result:** Users get 404 or "Coming Soon" if they try to access future content.

---

### Dynamic Sitemap

**Only includes published content:**

```javascript
const publishedUrls = Object.entries(CONTENT_SCHEDULE)
  .filter(([url, data]) => data.date <= today)  // Only past/today
  .map(...);
```

**Result:** Google only crawls published content.

---

### Automated Content Generation

**Python script uses Claude API:**

```python
content = generate_blog_post(
    title="Turn Website Into Mobile App",
    keyword="turn website into mobile app",
    word_count=2000
)

save_content(content, week=2, day='day-08')
update_middleware({'/blog/turn-website-into-mobile-app': '2026-03-06'})
update_sitemap({'/blog/turn-website-into-mobile-app': '2026-03-06'})
git_commit_and_push()
```

**Result:** Hands-free content generation and publishing.

---

## 🛠️ Customization

### Change Publish Schedule

**Edit middleware.js:**

```javascript
const CONTENT_SCHEDULE = {
  '/blog/my-post': '2026-03-20',  // Changes publish date
};
```

### Add New Content Type

**Middleware already supports:**
- `/blog/*` - Blog posts
- `/convert/*` - Platform conversion pages
- `/solutions/*` - Industry pages
- `/alternatives/*` - Alternative pages
- `/compare/*` - Comparison pages
- `/features/*` - Feature pages

**To add more:**

```javascript
export const config = {
  matcher: [
    '/your-new-section/:path*',  // Add here
  ],
};
```

### Customize Coming Soon Page

**Option 1: Redirect to custom page**

```javascript
return NextResponse.redirect(new URL('/coming-soon', request.url));
```

**Option 2: Show inline message**

```javascript
return new NextResponse(
  `<h1>Available on ${publishDate}</h1>`,
  { status: 200, headers: { 'content-type': 'text/html' } }
);
```

---

## 📅 Content Schedule Management

### Adding Week 2 Content:

**In auto_publish.py:**

```python
WEEK_2_SCHEDULE = {
    'day-08': {
        'date': '2026-03-06',
        'title': 'Turn Website Into Mobile App',
        'slug': 'turn-website-into-mobile-app',
        'keyword': 'turn website into mobile app',
        'word_count': 2000,
    },
    # Add more...
}
```

**Run:**

```bash
python automation/auto_publish.py --week 2
```

**Result:** All Week 2 content generated, scheduled, and committed.

---

## 🔄 Daily Workflow

### Manual (10 minutes/day):

**Every morning:**
1. Check what's publishing today
2. Review generated content (if using automation)
3. Verify live on site
4. Submit URL to Search Console

### Semi-Automated (2 minutes/day):

**Every morning:**
1. Check GitHub Actions log
2. Verify deployment succeeded
3. That's it!

### Fully Automated (0 minutes/day):

**GitHub Actions handles everything:**
- Generates content
- Updates schedule
- Deploys
- Notifies you if errors

You just check analytics weekly!

---

## 🧪 Testing

### Test Middleware Locally:

```bash
# Start Next.js dev server
npm run dev

# Visit future-dated content
# Should redirect to coming-soon or 404

# Change system date (for testing)
# Or edit middleware to use different date
```

### Test Sitemap:

```bash
# Generate sitemap
node automation/sitemap-generator.js

# Check public/sitemap.xml
# Should only include published content
```

### Test Python Script:

```bash
# Dry run (no API calls)
python automation/auto_publish.py --schedule

# Generate single post (for testing)
# Edit script to generate one post
```

---

## 🐛 Troubleshooting

### Content Not Showing

**Check:**
1. Is `current_date >= publish_date`?
2. Is middleware.js in root of Next.js project?
3. Is path in CONTENT_SCHEDULE exactly matching?
4. Did you redeploy after changing schedule?

**Fix:**
- Check middleware.js console logs
- Verify date format: `YYYY-MM-DD`
- Ensure no typos in paths

---

### Sitemap Not Updating

**Check:**
1. Is sitemap route file in correct location?
2. Is CONTENT_SCHEDULE updated?
3. Did you clear cache?

**Fix:**
```bash
# Regenerate
node automation/sitemap-generator.js

# Or visit /sitemap.xml in browser
# Should auto-generate
```

---

### GitHub Actions Failing

**Check:**
1. Are secrets set correctly?
2. Is CLAUDE_API_KEY valid?
3. Check workflow logs in Actions tab

**Fix:**
- Review error in Actions logs
- Verify API key has credits
- Check file paths in workflow

---

## 💡 Best Practices

### 1. Test Before Automating

- Generate Week 2 manually first
- Verify middleware works
- Check sitemap generates correctly
- Then enable GitHub Actions

### 2. Monitor Initially

- Check deployments daily (first 2 weeks)
- Verify content publishes on time
- Watch for errors
- Adjust as needed

### 3. Schedule Buffer

- Generate content 1 day before publish date
- Gives you time to review
- Catch errors before going live

### 4. Backup Strategy

- Keep generated content in git
- Don't rely solely on automation
- Have manual publish process ready

---

## 🚀 Deployment Options

### Vercel (Recommended for Next.js)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Redeploys automatically via GitHub Actions
```

### Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod

# Add build hook for automation
```

### Custom Server

```bash
# Build Next.js
npm run build

# Start
npm start

# Or use PM2 for process management
pm2 start npm --name "websitetoapp" -- start
```

---

## 📊 Cost Estimate

### Claude API Costs:

**Per blog post:**
- ~6,000 tokens (input prompt)
- ~4,000 tokens (output content)
- Total: ~10,000 tokens per post
- Cost: ~$0.30 per post (Sonnet 4)

**Weekly (5 posts):**
- $1.50/week

**Monthly (20 posts):**
- $6/month

**90 days (65 posts):**
- $20 total

**GitHub Actions:**
- Free (2,000 minutes/month)

**Vercel/Netlify:**
- Free tier sufficient

**Total Monthly Cost:** ~$6 (Claude API only)

---

## 🎯 Next Steps

1. **Choose your approach:**
   - Manual: Copy middleware.js
   - Semi-auto: Use Python script
   - Full-auto: GitHub Actions

2. **Set up infrastructure:**
   - Deploy Next.js to Vercel
   - Configure GitHub secrets
   - Test middleware

3. **Generate first week:**
   ```bash
   python automation/auto_publish.py --week 2
   ```

4. **Enable automation:**
   - Push GitHub Actions workflow
   - Verify daily runs work
   - Monitor for 1 week

5. **Scale:**
   - Add more weeks
   - Optimize based on data
   - Adjust publish schedule

---

## 🤝 Support

**Questions?**
- Check this README first
- Review code comments
- Test locally before deploying

**Issues?**
- Check GitHub Actions logs
- Verify API keys
- Review Vercel deployment logs

**Want to extend?**
- Python script is fully customizable
- Middleware can handle complex logic
- Add more automation as needed

---

**You now have a complete automated publishing system!** 🎉

From generating content to publishing to search engines discovering it - all automated.

**Time savings:** ~10 hours/week → ~30 minutes/week

**Let the robots do the work while you focus on strategy!** 🤖
