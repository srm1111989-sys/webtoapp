# Implementation Guide - Get Running in 30 Minutes

**From generated content → live website with automated publishing**

---

## ✅ What You Have Now

All content for Week 1 (4 pieces, 20,900+ words):
- ✅ Pricing comparison page
- ✅ Pillar #1: Convert Website to Android App (6,500 words)
- ✅ Pillar #2: WordPress to Android App (5,800 words)
- ✅ Pillar #3: Shopify to Mobile App (6,200 words)

All automation code:
- ✅ Date-based routing middleware
- ✅ Dynamic sitemap generator
- ✅ Dynamic robots.txt generator
- ✅ Python auto-publisher
- ✅ GitHub Actions workflow

---

## 🚀 Implementation (Choose Your Path)

### Path A: Quick Manual Setup (30 min)

**Best for:** Testing, learning, getting started fast

#### Step 1: Copy Generated Content (5 min)

```bash
# Copy markdown files from generated-content/week-01/ to your Next.js project
cp generated-content/week-01/*.md your-nextjs-project/content/blog/
```

#### Step 2: Add Date-Based Routing (10 min)

```bash
# Copy middleware to Next.js root
cp automation/next-middleware.js your-nextjs-project/middleware.js
```

**Edit middleware.js** - Update CONTENT_SCHEDULE with your publish dates:

```javascript
const CONTENT_SCHEDULE = {
  '/pricing': '2026-03-01',
  '/blog/convert-website-to-android-app': '2026-03-02',
  '/blog/wordpress-to-android-app': '2026-03-03',
  '/blog/shopify-to-mobile-app': '2026-03-04',
};
```

#### Step 3: Add Dynamic Sitemap (5 min)

**For Next.js App Router:**

```bash
mkdir -p your-nextjs-project/app/sitemap.xml
cp automation/sitemap-generator.js your-nextjs-project/app/sitemap.xml/route.js
```

**For Next.js Pages Router:**

```bash
cp automation/sitemap-generator.js your-nextjs-project/pages/api/sitemap.xml.js
```

Update content schedule in sitemap file to match middleware.

#### Step 4: Add Dynamic Robots.txt (5 min)

```bash
mkdir -p your-nextjs-project/app/robots.txt
cp automation/robots-generator.js your-nextjs-project/app/robots.txt/route.js
```

#### Step 5: Deploy (5 min)

```bash
# Deploy to Vercel
vercel --prod

# Or commit and push (auto-deploys if connected)
git add .
git commit -m "Add Week 1 content with date-based routing"
git push
```

**Done!** Your content will auto-show on the scheduled dates.

---

### Path B: Python Automation (1 hour)

**Best for:** Batch generating multiple weeks

#### Step 1: Install Dependencies (2 min)

```bash
pip install anthropic
```

#### Step 2: Set API Key (1 min)

```bash
# Linux/Mac
export CLAUDE_API_KEY=your_api_key_here

# Windows
set CLAUDE_API_KEY=your_api_key_here
```

#### Step 3: Test with Week 2 (30 min)

```bash
python automation/auto_publish.py --week 2
```

This will:
1. Generate all 5 Week 2 blog posts using Claude API
2. Save to `generated-content/week-02/`
3. Update middleware.js
4. Update sitemap-generator.js
5. Commit to git

**Review generated content** before pushing:

```bash
# Check what was generated
ls generated-content/week-02/

# Review a post
cat generated-content/week-02/day-08-turn-website-into-mobile-app.md
```

#### Step 4: Deploy Week 2 (5 min)

```bash
# If happy with generated content
git push

# Vercel auto-deploys
```

#### Step 5: Check Publishing Schedule (2 min)

```bash
python automation/auto_publish.py --schedule
```

Shows what's published and what's coming.

---

### Path C: Full Automation with GitHub Actions (2 hours)

**Best for:** Complete hands-off operation

#### Step 1: Set Up Repository (10 min)

```bash
# If not already a git repo
git init
git add .
git commit -m "Initial commit"

# Push to GitHub
gh repo create websitetoapp-seo --public
git push -u origin main
```

#### Step 2: Add GitHub Secrets (5 min)

Go to: `https://github.com/YOUR_USERNAME/websitetoapp-seo/settings/secrets/actions`

Add:
- **CLAUDE_API_KEY** - Your Claude API key
- **VERCEL_TOKEN** - Your Vercel token (optional)

#### Step 3: Add Workflow (5 min)

```bash
mkdir -p .github/workflows
cp automation/github-actions-workflow.yml .github/workflows/auto-publish.yml

git add .github/workflows/auto-publish.yml
git commit -m "Add auto-publish workflow"
git push
```

#### Step 4: Test Manual Trigger (10 min)

1. Go to GitHub Actions tab
2. Click "Auto-Publish Content"
3. Click "Run workflow"
4. Input: week = 2
5. Watch it run!

#### Step 5: Enable Daily Automation (2 min)

**It's already enabled!** The workflow runs daily at 8 AM UTC.

**What it does:**
- Checks if content scheduled for today
- Generates if needed (using Claude API)
- Updates middleware & sitemap
- Commits changes
- Deploys to Vercel

**You just check emails for:**
- ✅ Success notifications
- ❌ Failure alerts (if something breaks)

---

## 🎯 Recommended Approach (Hybrid)

**Week 1:** Manual (learn the system)
- Copy generated content
- Set up middleware
- Deploy manually
- Verify everything works

**Week 2:** Python script (batch generation)
- Generate all 5 posts at once
- Review before publishing
- Push when ready

**Week 3+:** GitHub Actions (full automation)
- Set it and forget it
- Content publishes daily
- You just monitor analytics

**Time investment:**
- Week 1: 2 hours
- Week 2: 30 minutes
- Week 3+: 10 minutes/week (monitoring only)

---

## 📋 Testing Checklist

After setup, test these:

### 1. Middleware Test

```bash
# Start dev server
npm run dev

# Visit future-dated URL
# Example: http://localhost:3000/blog/wordpress-to-android-app

# Should show:
# - "Coming soon" (if date is future)
# - Content (if date is today/past)
```

### 2. Sitemap Test

```bash
# Visit sitemap
http://localhost:3000/sitemap.xml

# Verify:
# - Only published content listed
# - Future content NOT listed
# - Dates correct
```

### 3. Robots.txt Test

```bash
# Visit robots
http://localhost:3000/robots.txt

# Verify:
# - Sitemap URL correct
# - Allow/Disallow rules correct
```

### 4. Production Test

After deploying:

```bash
# Visit live sitemap
https://websitetoapp.app/sitemap.xml

# Verify same as local
```

---

## 🐛 Common Issues & Fixes

### Issue: "Content showing before publish date"

**Cause:** Middleware not working

**Fix:**
1. Verify middleware.js is in project root
2. Check date format: `YYYY-MM-DD`
3. Ensure path matches exactly (case-sensitive)
4. Redeploy

### Issue: "Sitemap empty"

**Cause:** All content dates are future

**Fix:**
1. Check current date vs publish dates
2. Update dates if needed
3. Regenerate sitemap

### Issue: "Python script fails"

**Cause:** Missing API key or deps

**Fix:**
```bash
# Check API key
echo $CLAUDE_API_KEY

# Reinstall dependencies
pip install --upgrade anthropic
```

### Issue: "GitHub Actions not running"

**Cause:** Workflow file location or secrets

**Fix:**
1. Verify file at `.github/workflows/auto-publish.yml`
2. Check secrets in GitHub settings
3. Re-run manually from Actions tab

---

## 📊 Week-by-Week Rollout Plan

### Week 1 (Feb 27 - Mar 5)
**Status:** ✅ Content Generated

**Action:**
- Copy content to your project
- Set up middleware
- Deploy
- Verify dates working

**Time:** 2 hours

---

### Week 2 (Mar 6 - Mar 12)
**Status:** Ready to generate

**Action:**
```bash
python automation/auto_publish.py --week 2
```

**Time:** 30 minutes (mostly automated)

---

### Week 3 (Mar 13 - Mar 19)
**Status:** Can pre-generate or automate

**Option A (Manual):**
```bash
python automation/auto_publish.py --week 3
```

**Option B (Automated):**
Let GitHub Actions generate daily

**Time:** 10 minutes (if manual) or 0 (if automated)

---

### Week 4-13
**Status:** Full automation recommended

**Action:**
- Enable GitHub Actions
- Monitor daily
- Adjust based on analytics

**Time:** 10 min/week (monitoring only)

---

## 🎯 Next Actions (Right Now)

### If you want to go live TODAY:

**1. Quick Deploy (30 min):**
```bash
# 1. Create Next.js project (if you don't have one)
npx create-next-app@latest websitetoapp-site

# 2. Copy content
cp -r generated-content/week-01/*.md websitetoapp-site/content/

# 3. Copy middleware
cp automation/next-middleware.js websitetoapp-site/middleware.js

# 4. Deploy
cd websitetoapp-site
vercel deploy --prod
```

**Done!** Site is live with date-based content.

---

### If you want to set up automation FIRST:

**1. Install & Configure (1 hour):**
```bash
# Install Python deps
pip install anthropic

# Set API key
export CLAUDE_API_KEY=your_key

# Test generation
python automation/auto_publish.py --schedule
```

**2. Generate Week 2:**
```bash
python automation/auto_publish.py --week 2
```

**3. Set up GitHub Actions:**
```bash
# Add secrets on GitHub
# Copy workflow file
# Push and enable
```

---

## 💡 Pro Tips

**1. Start Simple**
- Use manual approach first
- Learn how middleware works
- Then add automation

**2. Test Locally Always**
- Run `npm run dev`
- Test date-based routing
- Verify before deploying

**3. Monitor First Month**
- Check deployments daily
- Verify content publishes on time
- Catch issues early

**4. Use Git Branches**
```bash
# Create feature branch for Week 2
git checkout -b week-02
python automation/auto_publish.py --week 2
git push origin week-02
# Review, then merge to main
```

**5. Schedule Buffer**
- Generate content 1 day early
- Gives time to review
- Catch errors before live

---

## 🚀 You're Ready!

You have:
- ✅ All Week 1 content generated
- ✅ Date-based routing system
- ✅ Dynamic sitemap & robots.txt
- ✅ Python automation script
- ✅ GitHub Actions workflow
- ✅ Complete documentation

**Pick your implementation path and go!**

**Simplest start:** Copy generated content + middleware → deploy (30 min)

**Most automated:** Set up GitHub Actions → let it run (2 hours setup, then 0 hours/week)

**Questions?** Check automation/README.md for detailed docs.

---

**Let's launch this! 🚀**
