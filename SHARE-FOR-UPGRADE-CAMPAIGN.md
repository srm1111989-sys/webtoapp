# Share-for-Upgrade Campaign (draft 2026-07-13)

Audience: ~86 users with a successful free Android build (99 emails incl. desktop).
Offer: post about your app publicly → reply with the URL → we verify → free premium build
(no watermark, no trial, AAB + keystore for Play Store).

---

## Email to free-build users

**Subject options (pick one):**
- Your free app + a free upgrade — one small favor
- Get your Play Store-ready build free (2-minute ask)
- We'll unlock your premium build — here's how

**Body:**

Hi {first_name},

You built **{app_name}** with WebToApp on the free plan — hope it's working well for you!

Quick offer: we're a small team growing by word of mouth, and we'd love your help.

**Post about your app anywhere public** — X/Twitter, LinkedIn, Facebook, a blog, your
community — and we'll upgrade you to a **premium build, free**:

- ✅ No watermark
- ✅ No trial limit — yours forever
- ✅ AAB file + signing keystore, ready for the Google Play Store

**How it works:**
1. Share a post about your app or WebToApp (feel free to use the template below, or write your own — honest words work best).
2. Reply to this email with the link to your post.
3. We'll verify it and send your premium build within 24 hours.

**Copy-paste template if you want it:**

> I turned my website into an Android app in about 10 minutes with websitetoapp.app —
> no code, push notifications included. Here's mine: {app_or_site_link}

That's it. No catch — one public post, one premium build.

Thanks for building with us,
Swapnil
WebToApp · https://websitetoapp.app
Questions? Just reply — this inbox is read by a human.

---

## Share templates (offer users a choice)

**X/Twitter:**
> I converted my website into an Android app with @{handle_or_link} in minutes — no code.
> Free to try: https://websitetoapp.app 📱 Here's my app: {link}

**LinkedIn:**
> We needed a mobile app for {business} but didn't want a dev project. websitetoapp.app
> turned our website into a native Android app — push notifications, our branding, done
> in an afternoon. Recommended if you have a website and no app yet.

**WhatsApp status / Facebook (for Indian SMB users):**
> Website se Android app banaya sirf 10 minute mein — websitetoapp.app. No coding.
> Try karo: https://websitetoapp.app

---

## Announcement post (company X/LinkedIn, optional)

> Built a free app with WebToApp? 🎁
> Share your app publicly (X, LinkedIn, anywhere), send us the link, and we'll unlock
> your **premium build free** — no watermark, Play Store-ready AAB included.
> Check your inbox, or email support@websitetoapp.app with your post link.

---

## Ops checklist (internal)

**Verification (manual, ~1 min each):**
- [ ] Post is public (open the URL logged out / incognito)
- [ ] Mentions WebToApp / websitetoapp.app by name or link
- [ ] Account looks real (not created yesterday with zero followers)
- [ ] One redemption per user; log: email, post URL, date, build order id

**Fulfilment — ⚠️ important gotcha:**
`build_service.py` decides free vs premium by `order.amount == 0`. Do NOT fulfil via a
100%-off promo code or a manual $0 order — that build would come out watermarked with a
trial again. Options:
- Create the order with a nominal amount (e.g. 1) marked paid manually, OR
- Add a `force_premium` flag/override before running the campaign, OR
- Trigger the build, then have admin flip the variables (`SHOW_WATERMARK=false`,
  `TRIAL_DAYS=0`, `BUILD_AAB=true`) on the pipeline manually.
Decide the mechanism BEFORE sending the email.

**Sending:**
- From support@websitetoapp.app (replies land where verification happens)
- Batch small (10–20/day) — keeps verification load sane and avoids spam flags
- Skip users whose email bounced previously; suppress unsubscribes

**Tracking:** log sends and redemptions in MARKETING-TRACKER-90D-2026-07.md (Outreach
Sent tab) — sends, replies, verified posts, upgrades granted, and any users who then
bought a paid plan for a second app.
