# Directory Listing Drafts (t130, 2026-07-29)

Ready-to-paste copy for the directories LLMs and buyers actually read. These are the
sources behind "ChatGPT recommends Median/Appilix" — being listed is the fix (t127).
Post via the Chrome extension while logged in; say "post the AlternativeTo listing".

## AlternativeTo — POSTED 2026-07-29, pending admin approval (~24h weekdays)
Listing: https://alternativeto.net/software/websitetoapp/ — icon (512px from favicon.svg), 2 screenshots (landing+pricing), Freemium+Purchase $35-50, tags mobile-app-builder/no-code-app-builder/webview/no-coding, 8 alternatives linked (WebIntoApp, Convertify, Twinr, Web2Apk, webtoapp.design, AppConvertly, WebViewGold*, WeSetupYourWebViewApp).

- **Name**: WebsiteToApp
- **URL**: https://websitetoapp.app
- **Short description** (tagline): Convert any website into an Android app (APK/AAB),
  iOS app (beta), or Windows .exe — one-time payment, no coding, no subscription.
- **Full description**: WebsiteToApp turns any website into a native mobile or desktop
  app in minutes. Paste your URL, customize the icon, splash screen, colors and 40+
  features (push notifications, biometric login, offline mode, AdMob, QR scanner,
  pull-to-refresh, custom keystore signing for Play Store updates), and download a
  signed APK/AAB, an iOS .ipa with full Xcode source (beta), or a Windows installer.
  One-time payment from $35 — no monthly platform fee. Free watermarked plan available.
- **License**: Freemium (free plan with watermark; paid one-time from $35)
- **Platforms**: Online / Web-based; outputs Android, iOS, Windows
- **List as alternative to**: GoNative.io, Median, WebIntoApp, Appilix, Appy Pie,
  AppsGeyser, Nativefier, WebViewGold
- **Tags**: website-to-app, app-builder, no-code, webview, apk-builder

## Product Hunt (producthunt.com/posts/new)

- **Name**: WebsiteToApp
- **Tagline**: Your website as an Android, iOS or Windows app — $35 once, no code
- **Description**: Paste a URL, pick your branding and features (push, biometrics,
  offline, AdMob, 40+ total), download a store-ready signed app. One-time pricing —
  built for indie makers, agencies and small businesses tired of $99/mo wrappers.
- **Topics**: No-Code, Android, Developer Tools, SaaS
- **First comment (maker)**: honest build story — one-time pricing rationale, the
  referral program, and the new website-to-EXE converter. Keep it personal.

## SaaSHub (saashub.com/submit) — READY TO PASTE (drafted 2026-08-02, not yet posted)

Prices below verified against `backend/docs/webtoapp-guide.md` (2026-08-02).

- **Name**: WebsiteToApp
- **Website**: https://websitetoapp.app
- **Tagline** (short description, keep under ~100 chars): Convert any website into an
  Android, iOS or Windows app — one-time payment, no coding.
- **Description**:
  WebsiteToApp turns any website URL into a native app in minutes — no code, no build
  tooling. Paste your URL, customize the app name, icon, splash screen and colors, then
  pick from 50+ features: push notifications (Firebase FCM), biometric/PIN lock, offline
  mode, AdMob, pull-to-refresh, bottom navigation, side drawer, screenshot block, SSL
  pinning and custom keystore (.jks) upload for Play Store updates. Download a signed APK
  and AAB, a Windows .exe installer, or an iOS build (beta).
  Pricing is one-time, not subscription: the free plan gives 5 lifetime builds with every
  feature included (watermark banner, 15-day trial), and a paid Android or Desktop app is
  $35 once. A Play Store publishing add-on is $15, or $50 for the app + listing bundle.
  APK and AAB are included on every plan, including free.
- **Pricing model**: Freemium — free plan available; paid from $35 one-time
- **Categories**: App Development / No-Code / Mobile Development / Developer Tools
- **Platforms**: Web-based (builds for Android, Windows, iOS beta)
- **Alternatives to claim**: GoNative (Median), WebIntoApp, Appilix, Appy Pie,
  AppsGeyser, Nativefier, WebViewGold, Twinr
- **Assets**: logo 512px from `frontend/public/favicon.svg`; screenshots — landing hero,
  builder wizard, build-success/download screen (grab at 1280×800)

## G2 + Capterra (need vendor accounts — operator action)

- Both require a company/vendor signup with email verification, then a product
  profile review (days). Copy above fits both. Screenshots: use the landing page
  hero, the wizard, and the build-success screen (grab fresh ones at 1280×800).
- Worth it: G2/Capterra pages rank for "X alternatives" queries and feed LLM answers.

## Other products (drafted 2026-08-02, prices verified 2026-08-09, none posted yet)

Same copy works for both AlternativeTo and SaaSHub — they ask for the same fields.
Post one product per Sunday slot; AlternativeTo first (no account barrier).

### IndexFlow — https://indexflow.net
Pricing verified against `IndexFlow/frontend/src/app/pricing/page.tsx` (2026-08-02).

- **Tagline**: Check, submit and monitor Google indexing for your URLs — in bulk.
- **Description**: IndexFlow tells you which of your pages Google has actually indexed,
  submits the ones that aren't, and keeps watching them afterwards. Bulk index checking,
  multi-channel submission, automated re-checks with status history, CSV export, an API
  with webhooks, and per-client campaigns for agencies. Most indexing tools only submit
  URLs and never tell you whether it worked — IndexFlow closes that loop by verifying
  index status before and after.
- **Pricing model**: Freemium — free plan (50 credits/month, no card); Starter $12/mo
  (1,500 credits), Pro $29/mo (5,000), Agency $79/mo (20,000). One-time credit packs:
  500 for $5, 2,000 for $15, 10,000 for $49.
- **Categories**: SEO / Marketing / Developer Tools
- **Alternatives to claim**: Omega Indexer, Rapid URL Indexer, IndexMeNow,
  Indexification, ColinkRI, SpeedyIndex, Linklicious, One Hour Indexing

### ModbusSimulator — https://modbussimulator.com
- **Tagline**: Modbus master and slave simulator in one app — TCP, RTU, ASCII and UDP.
- **Description**: A Windows Modbus simulator that runs as both master (poll a device)
  and slave (emulate one) in a single application, over Modbus TCP, RTU, ASCII and UDP.
  Built for PLC and HMI engineers who need to test register maps, exercise an HMI
  against simulated slaves, or debug a field device without hauling hardware to the
  desk. 30-day free trial with all features unlocked, no registration and no card;
  one-time license after that, with no subscription.
- **Pricing model**: Free trial (30 days, all features, no card), then $59 one-time
  (single license; $49/each for the 3+ license pack).
  ✅ VERIFIED 2026-08-09: the live checkout is the source of truth — `public/index.html`
  calls `openPurchaseModal(59, 1)` (single) and `openPurchaseModal(49, 3)` (3-pack), and
  the payment APIs charge the amount the page sends. $59 is what buyers actually pay.
  ⚠️ Separate site defect (does NOT block this listing): the desktop app UI
  (`src/renderer/App.tsx`) and some blog/comparison pages still say $99, and
  `api/chatbot.ts` says $49 — display drift vs the $59 checkout, worth a
  release-consistency fix.
- **Categories**: Development / Industrial Automation / Network Tools
- **Alternatives to claim**: Modbus Poll, Modbus Slave (Witte Software), QModMaster,
  ModbusMechanic, Simply Modbus, EasyModbus, CAS Modbus Scanner, modpoll/diagslave

### OwnStore — https://ownstore.app
- **Tagline**: GST billing and an online storefront for small Indian businesses.
- **Description**: OwnStore gives a small Indian shop or service business GST-compliant
  billing and its own online store without a developer. Create a GST invoice in seconds,
  import an existing product list, take UPI payments, and publish a storefront or
  landing page from templates. Built for kirana stores, boutiques, trades and local
  service providers rather than for developers.
- **Pricing model**: Free for the first 2 months (all features, no credit card), then
  Growth at ₹199/month or ₹1,990/year. No transaction cut on store payments (merchant
  connects their own Razorpay).
  ✅ VERIFIED 2026-08-09 against the live API (`https://ownstore.app/api/subscriptions/plans`
  returns exactly two plans: FREE trial + GROWTH ₹199/mo, ₹1,990/yr) and
  `frontend/app/pricing/page.tsx`. The ₹249/₹499 tiers in `SERVICE-PROVIDER-PLAN.md`
  are a proposal doc, not live — do not use them. Note: the backend seed
  (`backend/app/models/subscription.py` DEFAULT_PLANS: Starter ₹299/Pro ₹799/Agency
  ₹2499) is stale vs the live DB — only relevant on a fresh install, ignore for listings.
- **Categories**: Accounting / Invoicing / eCommerce / Small Business
- **Alternatives to claim**: Vyapar, myBillBook, Zoho Invoice, Khatabook, Dukaan,
  Tally, Instamojo

## Cadence

Day 1: AlternativeTo (no account barrier, biggest LLM footprint) — via Chrome. DONE
2026-07-29 for WebsiteToApp.
Day 2: SaaSHub for WebsiteToApp — copy ready above, blocked on a browser session.
Day 3-5: Product Hunt (pick a Tuesday, prep maker comment).
Week 2: G2 + Capterra vendor signups (operator), then profiles.
Then: one other product per Sunday — IndexFlow first (copy ready, no blockers), then
ModbusSimulator and OwnStore (prices verified 2026-08-09 — all four products are now
post-ready; the only remaining blocker is a browser session with the Chrome extension).
