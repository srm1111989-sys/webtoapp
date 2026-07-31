# Last updated: 2026-07-31 by plan-updater based on SC data
# Last updated: 2026-07-30 by plan-updater based on SC data
# Last updated: 2026-07-28 by plan-updater based on SC data
# WebsiteToApp.app — SEO Plan (created 2026-07-20 from Search Console data)

Nightly-updated by the SEO agent (plan updater appends dated entries; agent
marks tasks [x] DONE). Data window for baseline: 2026-06-20 → 2026-07-19.

## Where we stand (GSC baseline)

| Cluster | Query | Imp | Pos | Note |
|---|---|---|---|---|
| Competitor brand | `webintoapp` | 1,244 | 6.8 | Our BIGGEST impression source; comparison blog already converts (signup 07-19) |
| Own brand | `websitetoapp` | 40 | 1.7 | Healthy |
| Own brand | `webtoapp` | 422 | 9.8 | Push to top-3 — competitor webtoapp.design outranks |
| **EXE cluster** | `website to exe converter` | 18 | 8.1 | Near page-1 top |
| | `website to exe` | 32 | 10.0 | |
| | `web to exe` | 35 | 15.3 | |
| | `webtoexe` | 24 | 6.1 | |
| | `exe to app converter online` | 20 | 5.9 | |
| | `.exe to .app` | 18 | 8.7 | Mac-direction intent |
| | `site to exe` | 10 | 25.0 | |
| Head terms | `website to app` | 274 | 31.2 | Long game |
| | `website to app converter free` | 242 | 25.7 | "free" intent — free-build funnel |
| | `convert website to app for free` | 52 | 25.5 | |
| Niche | `html to app` | 45 | 15.7 | |

**Strategy:** (1) own the EXE/desktop cluster — 7 queries hovering pos 6–15
where one strong hub page + internal links can take page 1; (2) squeeze the
`webintoapp` competitor traffic we already earn; (3) grow "free" intent pages
for the 500+ imp of `…free` queries sitting at pos 25.

## Tasks

### P1 — EXE / desktop cluster (closest to page 1)
- [x] DONE — Build `/website-to-exe` hub page: already satisfied by existing
      /convert/website-to-exe page, no new page needed.
- [x] DONE (2026-07-21) — Internal-link the hub from homepage footer + /pricing
      + the desktop-cluster blogs. Added a footer "Website to EXE Converter"
      link (global, shown on homepage + every public page via
      `PublicLayout.tsx`), a "free website to EXE converter" link in the
      Desktop App Plans section of `/pricing`, and inline
      `/convert/website-to-exe` links in the 3 desktop-related posts:
      `website-to-windows-desktop-app` (Conclusion), `exe-to-app-converter-guide`
      (already had 3 inline links from 07-20), and
      `website-to-app-converter-complete-guide-2026` (Step 5 desktop mention;
      also added to the `BlogPost.tsx` cluster-link rule so it shows the
      "More on This Topic" hub card too).
- [x] DONE (2026-07-21) — CTR pass on `exe to app converter online` (pos 5.9):
      title/meta of `/convert/website-to-exe` now explicitly say "Free" +
      "Online" (title: "Free Website to EXE Converter Online — No Coding
      Required"; meta description leads with "Convert any website to a free
      downloadable .exe file online").
- [x] DONE — verified LIVE 2026-07-21 — live bundle index-Cr457zTn.js contains
      exe-to-app-converter-guide.
      (2026-07-20, agent): dedicated page/section for the
      reverse "exe → app" conversion intent — `exe to app` (pos 5.0, 13 imp,
      2 clicks) and `exe to app converter` (pos 6.6, 12 imp, 1 click) per
      today's brief.
      Confirmed via WebSearch that "exe to app converter online" is a
      genuinely different intent (users wanting to convert an existing
      compiled .exe into an APK) that no existing page/slug covered — the
      `/convert/website-to-exe` hub only targets the forward direction.
      Published blog post `/blog/exe-to-app-converter-guide` (added to
      `frontend/src/data/blogPosts.ts` + `sitemap.xml`) that explains why
      literal exe→apk conversion mostly doesn't work, captures the
      `exe to app` / `exe to app converter` / `exe to app converter online` /
      `webtoexe` query variants, and pivots readers to WebsiteToApp's
      website→exe+app dual-build flow. Cross-linked to/from
      `/convert/website-to-exe` and `/blog/website-to-windows-desktop-app`
      (added an `exe|desktop|windows` cluster-link rule in `BlogPost.tsx`).
      Note: task 1 above ("Build /website-to-exe hub page") was found to
      already be satisfied by the existing live `/convert/website-to-exe`
      platform page (slug `website-to-exe` in `platforms.ts`, target keyword
      "website to exe converter") — a second hub at the literal
      `/website-to-exe` path would have duplicated/competed with it, so this
      NEW task (genuinely uncovered intent) was executed instead as the
      higher-value topmost actionable item.
      DEPLOY STATUS (2026-07-21, agent): VERIFIED LIVE. Content was committed
      + pushed to `main` (commit d6ce075) on 07-20 but blocked on deploy at
      the time (`/opt/webtoapp/deploy.sh` root-owned mode 600). Today,
      downloaded the live production bundle
      (`https://websitetoapp.app/assets/index-Cr457zTn.js`) and confirmed via
      `grep` that it contains the string `exe-to-app-converter-guide` — not
      just a 200-status curl check (this is an SPA whose catch-all returns
      200 for any path, so grepping the bundle is the reliable verification
      method here). Deploy has since run (by ops) and the page is live.

### P1 — competitor comparison (biggest impression pool)
- [x] DONE — verified LIVE 2026-07-23 — live bundle index-Df-guIAG.js contains
      `branding-removal`, `89 one-time`, `Dedicated plan`, and the
      `What the "Free" Really Costs` heading, confirming the 07-22 expand of
      `/blog/webintoapp-alternative-websitetoapp` deployed successfully at some
      point between 07-22 and 07-23 (ops ran deploy.sh in the interim).
      (2026-07-22, agent): Expand `/blog/webintoapp-alternative-websitetoapp`
      — add comparison table (price, watermark, build time, desktop EXE
      support), update date.
      Verified via WebFetch of webintoapp.com/plans that WebIntoApp's free
      tier shows WebIntoApp's own branding/watermark + own AdMob ads, and its
      unbranded "Dedicated" plan starts at $89 one-time (not the previously
      stated $5–$49/month) — corrected pricing claims accordingly. Also
      confirmed WebIntoApp has **no desktop/.exe option at any tier**
      (Android/iOS only). Expanded the comparison table (added
      Watermark/branding and Desktop .exe rows), updated the price rows to
      the verified figures, added a "WebIntoApp Free Plan: What the 'Free'
      Really Costs You" section, updated Pricing Comparison + Conclusion, and
      bumped the post date to 2026-07-22.
      Internal links: added a cluster-link rule in `BlogPost.tsx` so this
      post now shows the EXE/desktop cluster links; added an explicit link
      from `/pricing` (below the WebIntoApp comparison table) and from
      `/convert/website-to-exe` (Related Guides row) to this post — 2 new
      direct internal links, plus the pre-existing links from 6 other blog
      posts and `/alternatives/webintoapp`.
      Committed + pushed from scratch clone (commit `532233f`, branch
      `main`). `bash /opt/webtoapp/deploy.sh` failed as expected (root-owned,
      mode 600, permission denied). Checked live status by downloading the
      live bundle (`index-bZP3n68X.js`) and grepping for new unique strings
      (`branding-removal`, `Free tier shows`, etc.) — none present; live
      bundle is still the pre-change build. **Not yet live** — leaving this
      task unchecked pending the ops deploy run.
- [x] DONE — verified LIVE 2026-07-23 (same bundle grep as above; the "What
      the 'Free' Really Costs You" section targeting `webintoapp free` shipped
      in the same 532233f commit). (2026-07-22, agent): Push `webintoapp free`
      (67 imp, pos 7.4): section targeting "free WebIntoApp alternative"
      inside the comparison post. Done as part of the same edit/commit above.
- [x] DONE — verified LIVE 2026-07-25 (bundle `index-jp2NR3Hq.js` contains the
      seoTitle `WebIntoApp Alternative (2026): Free Plan Watermark Costs $89
      to Remove`, the corrected `$89 one-time` / `$25 one-time` pricing pairs,
      and the updated pros/cons/switchReasons — confirms ops ran `deploy.sh`
      since 07-23). (2026-07-23, agent) — Refresh `/alternatives/webintoapp`
      (dedicated comparison landing page, `competitors.ts` `webintoapp` entry)
      — this page was NOT touched by the 07-22 blog-post expand and still had
      stale/inaccurate WebIntoApp pricing (`$16–$60/year` subscription model)
      that contradicted the freshly-verified facts (confirmed again today via
      WebFetch of webintoapp.com/plans: WebIntoApp has no annual-subscription
      tier at all — it's Free (watermarked, WebIntoApp's own branding+ads) or
      a **$89 one-time** Dedicated plan to unbrand). Also fixed a stale "us"
      price of `$10 one-time` (actual current price is `$25 one-time` per
      `Pricing.tsx`/the blog post). Rewrote the `webintoapp` entry in
      `competitors.ts` (pricing, pros/cons, feature table, verdict,
      switchReasons) with the correct $89-vs-$25 framing, and wrote a new
      CTR-focused title/meta (`WebIntoApp Alternative (2026): Free Plan
      Watermark Costs $89 to Remove`) targeting the `webintoapp` query
      directly — today's brief flagged this keyword's CTR as unusually low
      (1.5% at pos 6.6, 1,857 imp) despite the good position, so a sharper,
      concrete-number hook is the goal, not just accuracy. Also synced the
      same stale `$16-$60/yr` figure on the homepage competitor-tiles
      (`Landing.tsx`) and 4 WebIntoApp cells in the `/pricing` "How We
      Compare" table (`Pricing.tsx`) to the corrected `$89`/`Free or $89+`
      figures, since both pages link into this cluster and were showing
      contradictory numbers next to the corrected blog post.
      Internal links: this page was already linked from the homepage
      competitor tiles, `/pricing`, and cross-links to/from
      `/blog/webintoapp-alternative-websitetoapp` (`COMPARISON_BLOG_MAP` +
      the blog's own "Also compare" links) — no new links needed, existing
      links now just point at accurate content.
      Verified `npx tsc -b` clean (no type errors) before commit.
      Bumped `/alternatives/webintoapp`'s sitemap.xml lastmod to 2026-07-23.
      Committed + pushed from scratch clone. `bash /opt/webtoapp/deploy.sh`
      expected to fail (root-owned, mode 600) — not run from here. Left
      unchecked pending ops deploy + a future bundle-grep to confirm live
      (do not mark DONE until confirmed, per standing instructions — deploy
      hasn't had time to run yet).
      Flag for future consideration (out of scope today): the other 4
      competitor entries in `competitors.ts` (gonative, median, appsgeyser,
      appmysite) still reference a stale `$10 one-time` WebsiteToApp price
      (actual current price is `$25 one-time`) — same class of staleness bug,
      not fixed today since only `webintoapp` is in today's brief.

### P2 — reinforce "Getting traction" keywords (internal links)
- [x] DONE (2026-07-24, agent) — Audited the link inventory before adding
      anything, per the note below: `webintoapp` is already well-reinforced
      (4 pages link to `/blog/webintoapp-alternative-websitetoapp`: BlogPost.tsx
      cluster-link rule, ConvertPage.tsx, ComparisonPage.tsx, Pricing.tsx; the
      cluster-link rule also auto-adds `/alternatives/webintoapp` to every
      alternative/vs/comparison-tagged blog post) — no link-stuffing added.
      While auditing, found a real staleness bug instead: Landing.tsx's FAQ
      schema (`Is WebsiteToApp better than GoNative or WebIntoApp?`) still
      quoted the old WebIntoApp pricing (`$149+/year`), contradicting the
      corrected `$89 one-time to unbrand` figure already live elsewhere on
      the same page (competitor table) and in the blog post/`/alternatives`
      page — fixed to match. Also executed the P2 brand-defense task below in
      the same pass since both target the "getting traction" `webtoapp`/
      `webintoapp` cluster.
      (Original task text, added 2026-07-24 by plan-updater, preserved for
      context): Audit and add contextual internal links from additional blog
      posts / footer / pricing sections to the pages currently ranking for
      the three "getting traction" queries flagged in today's brief:
      `webintoapp` (pos 6.5, 2,155 imp, 32 clicks), `websitetoapp` (pos 1.5,
      17 clicks — homepage/brand), and `webtoapp` (pos 9.4, 12 clicks —
      homepage brand alias).

### P2 — free-intent funnel (lower priority — not in today's brief's opportunity range)
- [x] DONE (2026-07-26, agent) — Built `/blog/website-to-app-converter-free`
      targeting `website to app converter free` (242 imp, pos 25.7) and
      `convert website to app for free` (52 imp, pos 25.5). First checked for
      overlap per the task brief: grepped `blogPosts.ts`/`platforms.ts` for
      the exact phrases — no page used either phrase verbatim, though 3
      adjacent posts already existed (`website-to-apk-converter-free-vs-paid-2026`,
      `free-vs-paid-website-to-app-converters-2026`,
      `convert-website-to-android-app-free-2026` — all multi-tool
      roundup/comparison posts, none a direct "what's actually free here"
      funnel page), so a new, distinct post was justified rather than a
      duplicate (same reasoning precedent as the 07-20 exe-to-app-converter
      decision). Verified current pricing directly from `Pricing.tsx` instead
      of trusting older blog copy — found and avoided a real staleness trap:
      `Pricing.tsx` now shows Android/Desktop premium at **$35 one-time**
      (raised from $25 via commits `1d1ad16`/`a8f9bec`, "t80: raise Android
      pricing to $35"), but the still-live `webintoapp-alternative-websitetoapp`
      post and a few others still quote the old **$25** figure — that's a
      pre-existing staleness bug in already-shipped webintoapp content, which
      is explicitly out of scope today (webintoapp work is DONE/frozen per
      today's brief), so left as-is and flagged here for a future pass. The
      new post uses only verified-current numbers ($35 Android/Desktop, $25
      iOS beta unsigned+Xcode, $15 Play Store Listing add-on, $50 bundle, $9/mo
      optional Pro Monthly) and is honest about the free plan's real
      limitations (watermark, 15-day trial window, 5-build lifetime cap
      shared across all sites, no Android keystore download) alongside what's
      genuinely free (all 50+ features unlocked to test, Android/Desktop/iOS
      beta builds, no card required).
      Added to `frontend/src/data/blogPosts.ts` (auto-listed on `/blog` and
      picked up by `BlogPost.tsx`'s existing `related`/prev-next logic — no
      route changes needed, `/blog/:slug` is already generic) and to
      `frontend/public/sitemap.xml` (lastmod 2026-07-26).
      Cross-links: added a new `/free/` cluster-link rule in `BlogPost.tsx`
      (mirroring the existing `exe|desktop|windows` rule pattern) so every
      post with "free" in its slug — the 3 adjacent posts above, plus this
      one — now surfaces a link to this guide automatically, rather than
      manually stuffing links into just 1-2 posts. Also added a direct link
      from `/pricing`'s free-plan section (the site's existing "free trial"
      page) to the new post, since that's the natural place someone
      evaluating the free tier would look next. Did not touch any
      webintoapp-related content (page, blog, or pricing mentions), per
      today's explicit instruction that cluster is DONE and frozen pending
      human backlink/SERP review.
      Ran `npm install` (node_modules wasn't present in the scratch clone)
      then `npx tsc -b` — clean, exit 0, no type errors.
      Committed + pushed from scratch clone. `bash /opt/webtoapp/deploy.sh`
      not runnable here (root-owned) — not claiming live, left for ops to
      deploy; a future pass should bundle-grep to confirm.

### P2 — brand defense
- [x] DONE (2026-07-24, agent) — Added `alternateName: ['WebToApp', 'Website
      to App']` to both the WebSite and SoftwareApplication JSON-LD blocks on
      the homepage (`Landing.tsx`). For the visible H1/subtitle: rejected an
      initial `sr-only` (visually-hidden) text approach as hidden-text
      keyword stuffing, which risks a Google manual action — instead added a
      natural, visible "WebsiteToApp (also known as WebToApp)" mention in the
      site-wide footer (`PublicLayout.tsx`), which appears on every public
      page rather than just the homepage hero.

### P3 — niche (lowest priority — not in today's brief either)
- [x] DONE (2026-07-28, agent) — Published `/blog/turn-html-site-into-android-app`
      targeting `html to app` (pos 15.7), covering the no-framework/no-CMS
      static-HTML intent distinctly from the existing `/convert/html-website`
      platform page (commercial conversion-flow page vs. this new
      informational blog explainer). This was the only undone task anywhere
      in the plan today — the EXE cluster and webintoapp cluster are both
      fully covered/frozen per the 07-28 plan-updater reconciliation above.
      Cross-linked to `/convert/html-website`,
      `/blog/website-to-app-converter-complete-guide-2026`, and
      `/blog/best-website-to-app-converters-2026`; picks up automatic
      cluster links via `BlogPost.tsx`'s core-links block. Added to
      `blogPosts.ts` + `sitemap.xml` (lastmod 2026-07-28). `npx tsc -b`
      clean. Did NOT touch any `webintoapp`-related content — that cluster
      remains flagged for human backlink/SERP review after 4+ rewrite
      passes with no CTR movement.

## Update log
- 2026-07-31 (plan-updater): reprioritized against today's daily SC brief. All 6
  Push-to-Page-1 targets (`website to exe converter online free` pos 5.2,
  `exe to app` pos 5.4, `website to exe converter` pos 5.4, `exe to app
  converter` pos 6.0, `exe to app converter online` pos 6.1, `webintoapp` pos
  6.4 / 3,056 imp / 39 clicks) remain covered by existing DONE/verified-live
  tasks — the EXE/desktop cluster + CTR pass,
  `/blog/exe-to-app-converter-guide`, and
  `/blog/website-to-exe-converter-online-free` cover all 5 EXE-cluster
  keywords; the webintoapp comparison expand/free-push and the
  `/alternatives/webintoapp` refresh (both DONE, verified live) cover
  `webintoapp` — no new page task added, no duplicate created. No "Fix CTR"
  section for WebToApp in today's brief; `webintoapp`'s CTR (1.3%) remains
  flagged for human backlink/SERP review per the 2026-07-25 note after 4+
  rewrite/expand passes with no sustained movement — not queuing another
  autopilot pass. Today's "Getting traction" trio (`webintoapp` 39 clicks pos
  6.4, `websitetoapp` 19 clicks pos 1.3, `webtoapp` 12 clicks pos 9.5) is
  covered by the existing P2 link-audit + brand-defense tasks (both DONE
  2026-07-24) — no new task needed. P2 free-intent funnel and P3 `html to
  app` remain outside today's brief's Push-to-Page-1 window — left
  deprioritized, no change. No undone tasks remain anywhere in this plan
  (all P1/P2/P3 checkboxes are DONE) — no reprioritization action needed
  beyond this log entry.
- 2026-07-30 (plan-updater): reprioritized against today's daily SC brief. All 6
  Push-to-Page-1 targets (`website to exe converter online free` pos 5.3,
  `website to exe converter` pos 5.4, `exe to app converter online` pos 5.5,
  `exe to app` pos 5.5, `exe to app converter` pos 6.2, `webintoapp` pos 6.4 /
  2,985 imp / 39 clicks) remain covered by existing DONE/verified-live tasks —
  the EXE/desktop cluster + CTR pass, `/blog/exe-to-app-converter-guide`, and
  `/blog/website-to-exe-converter-online-free` cover all 5 EXE-cluster
  keywords; the webintoapp comparison expand/free-push and the
  `/alternatives/webintoapp` refresh (both DONE, verified live) cover
  `webintoapp` — no new page task added, no duplicate created. No "Fix CTR"
  section for WebToApp in today's brief; `webintoapp`'s CTR (1.3%) remains
  flagged for human backlink/SERP review per the 2026-07-25 note after 4+
  rewrite/expand passes with no sustained movement — not queuing another
  autopilot pass. Today's "Getting traction" trio (`webintoapp` 39 clicks pos
  6.4, `websitetoapp` 19 clicks pos 1.3, `webtoapp` 11 clicks pos 9.5) is
  covered by the existing P2 link-audit + brand-defense tasks (both DONE
  2026-07-24) — no new task needed. P2 free-intent funnel and P3 `html to
  app` remain outside today's brief's Push-to-Page-1 window — left
  deprioritized, no change. No undone tasks remain anywhere in this plan
  (all P1/P2/P3 checkboxes are DONE) — no reprioritization action needed
  beyond this log entry.
- 2026-07-28 (plan-updater): reprioritized against today's daily SC brief. All 6
  Push-to-Page-1 targets (`exe to app` pos 5.4, `exe to app converter online` pos
  5.7, `website to exe converter online free` pos 5.8, `website to exe converter`
  pos 5.8, `exe to app converter` pos 6.3, `webintoapp` pos 6.4 / 2,893 imp / 38
  clicks) remain covered by existing DONE/verified-live tasks — the EXE/desktop
  cluster + CTR pass, `/blog/exe-to-app-converter-guide`, and
  `/blog/website-to-exe-converter-online-free` (built 2026-07-27) cover all 5
  EXE-cluster keywords; the webintoapp comparison expand/free-push and the
  `/alternatives/webintoapp` refresh (both DONE, verified live) cover
  `webintoapp` — no new page task added, no duplicate created. No "Fix CTR"
  section for WebToApp in today's brief; `webintoapp`'s CTR (1.3%) remains
  flagged for human backlink/SERP review per the 2026-07-25 note after 4+
  rewrite/expand passes — not queuing another autopilot pass. Today's "Getting
  traction" trio (`webintoapp` 38 clicks pos 6.4, `websitetoapp` 17 clicks pos
  1.4, `webtoapp` 11 clicks pos 9.4) is covered by the existing P2 link-audit +
  brand-defense tasks (both DONE 2026-07-24) — no new task needed. P2
  free-intent funnel and P3 `html to app` remain outside today's brief's
  Push-to-Page-1 window — left deprioritized, no change. No other undone tasks
  target keywords outside today's brief.
- 2026-07-27 (2, agent): Built the topmost still-uncovered EXE-cluster gap —
  `website to exe converter online free` was the one query in today's brief's
  6-keyword EXE/desktop list not explicitly addressed by any existing
  page/FAQ (checked `/convert/website-to-exe` FAQs and
  `/blog/exe-to-app-converter-guide`'s FAQ — neither answers the "is it free
  AND online" combined intent). Published `/blog/website-to-exe-converter-online-free`
  (added to `blogPosts.ts` + `sitemap.xml`, lastmod 2026-07-27). Picks up
  automatic cross-links via the existing `exe|desktop|windows` and `free`
  cluster-link rules in `BlogPost.tsx` (slug matches both patterns) — no
  manual link-wiring needed. The other 5 brief keywords (`exe to app`,
  `website to exe converter`, `webtoexe`, `exe to app converter`, `exe to app
  converter converter online`) remain covered by existing DONE tasks per
  yesterday's reprioritization — no duplicate pages created.
  Separately, per today's explicit factual-accuracy task: verified the
  CURRENT real price directly from `Pricing.tsx` (`price_usd: 3500` = **$35
  one-time** for Android/Desktop premium — confirmed this is already the
  live/correct figure per the `t80`/`t97` commit history, NOT $25 as the task
  brief assumed). Audited all `webintoapp`-adjacent comparison content
  (`webintoapp-alternative-websitetoapp`, `competitors.ts`'s `webintoapp`
  entry, `best-website-to-app-converters-2026`, `website-to-apk-free`,
  `website-to-app-converter-complete-guide-2026`,
  `convert-wordpress-website-to-android-app`, `median-co-alternative`) and
  found the site-wide `$35` raise had missed several WebsiteToApp
  self-price mentions still quoting the pre-raise **$25** (or an even older
  **$10**) figure, inconsistent with the correct $35 already shown elsewhere
  in the same posts — fixed ~13 stale mentions across 7 files/posts to $35.
  Did NOT touch any `webintoapp` title/meta for CTR purposes (only the
  `description` field's stale dollar figure on
  `website-to-app-converter-complete-guide-2026` was corrected, which is a
  factual fix, not a CTR rewrite) — per standing instruction, that cluster's
  position/CTR stays flagged for human backlink/SERP review, not further
  autopilot content passes.
  Flag for a future pass (out of scope today): `best-website-to-app-converters-2026`
  still shows *WebIntoApp's own* price as a stale `Free-$25` / `$0-$25` in
  two places (should reflect the verified current `Free (watermarked) or $89
  one-time` model) — this is WebIntoApp's price, not ours, so left as a
  separate flagged issue rather than expanding today's scope.
  `npx tsc -b` clean after all edits. Committed + pushed from scratch clone.
- 2026-07-27 (plan-updater): reprioritized against today's daily SC brief. All 6
  Push-to-Page-1 targets (`exe to app` pos 5.4, `website to exe converter` pos
  5.7, `webtoexe` pos 6.1, `website to exe converter online free` pos 6.1, `exe
  to app converter` pos 6.3, `exe to app converter online` pos 6.4) remain
  covered by existing DONE/verified-live tasks — the EXE/desktop cluster + CTR
  pass and `/blog/exe-to-app-converter-guide` (which explicitly captures the
  `exe to app` / `exe to app converter` / `exe to app converter online` /
  `webtoexe` query variants per its original 07-20 description) cover all 6 —
  no new page task added, no duplicate created. Today's "Getting traction" trio
  (`webintoapp` 38 clicks pos 6.4, `websitetoapp` 18 clicks pos 1.4, `webtoapp`
  12 clicks pos 9.4) is covered by the existing P2 link-audit + brand-defense
  tasks (both DONE 2026-07-24) and the webintoapp comparison expand +
  `/alternatives/webintoapp` refresh (both DONE, verified live 2026-07-25) — no
  new task needed. No "Fix CTR" section for WebToApp in today's brief;
  `webintoapp`'s CTR remains flagged for human backlink/SERP review per the
  2026-07-25 note after 4 rewrite/expand passes — not queuing another autopilot
  pass. P2 free-intent funnel and P3 `html to app` remain outside today's
  brief's Push-to-Page-1 window — left deprioritized, no change. No other
  undone tasks target keywords outside today's brief.
- 2026-07-26 (2, agent): executed the topmost still-open task outside today's
  narrow brief window — the P2 free-intent funnel item (`website to app
  converter free` + `convert website to app for free`, ~300 combined imp at
  pos ~25.5-25.7). Deliberately did NOT touch anything webintoapp-related
  (page, blog, or pricing mentions) — that cluster is DONE/verified-live and
  flagged for human backlink/SERP review after 4 rewrite passes moved neither
  CTR nor position, so further on-page work there is diminishing returns; this
  site's single biggest impression pool otherwise sits idle without a genuine
  next task, so this legitimate, real-search-volume P2 item was built instead.
  Full details of what was built/verified are logged under the P2 task
  checkbox itself. Summary: new post `/blog/website-to-app-converter-free`
  (added to `blogPosts.ts` + `sitemap.xml`), cross-linked via a new `/free/`
  cluster-link rule in `BlogPost.tsx` plus a direct link from `/pricing`'s
  free-plan section, `npx tsc -b` clean, committed + pushed from scratch
  clone. Not yet verified live (deploy is ops-only from here).
- 2026-07-26 (plan-updater): reprioritized against today's daily SC brief. All 6
  Push-to-Page-1 targets (`exe to app` pos 5.3, `website to exe converter online
  free` pos 5.4, `website to exe converter` pos 5.8, `webtoexe` pos 6.1, `exe to
  app converter` pos 6.3, `webintoapp` pos 6.4 / 2,564 imp / 35 clicks) remain
  covered by existing DONE/verified-live tasks — the EXE/desktop cluster + CTR
  pass and `/blog/exe-to-app-converter-guide` cover `exe to app`, `website to
  exe converter`, `website to exe converter online free`, `webtoexe`, and `exe
  to app converter`; the webintoapp comparison expand/free-push and the
  `/alternatives/webintoapp` refresh (both DONE, verified live 2026-07-25) cover
  `webintoapp` — no new page task added, no duplicate created. No "Fix CTR"
  section for WebToApp in today's brief, but `webintoapp`'s CTR (1.4%) is
  unchanged from the pattern flagged 2026-07-25 after 4 rewrite/expand passes
  (07-21 through 07-24) — per that flag and the IndexFlow `indexchex`
  precedent, NOT queuing another autopilot content pass; stays flagged for
  human backlink/SERP review. Today's "Getting traction" trio (`webintoapp` 35
  clicks pos 6.4, `websitetoapp` 19 clicks pos 1.4, `webtoapp` 12 clicks pos
  9.4) is covered by the existing P2 link-audit + brand-defense tasks (both
  DONE 2026-07-24) — no new task needed. P2 free-intent funnel and P3 `html to
  app` remain outside today's brief's Push-to-Page-1 window — left
  deprioritized, no change. No other undone tasks target keywords outside
  today's brief.
- 2026-07-25 (2, agent): confirmed the topmost undone task — `/alternatives/
  webintoapp` refresh (BLOCKED ON DEPLOY since 07-23) — is now LIVE: grepped
  the current production bundle (`index-jp2NR3Hq.js`) and found the new
  seoTitle string, the `$89 one-time`/`$25 one-time` pricing pairs, and the
  rewritten pros/cons/switchReasons all present, confirming ops ran
  `deploy.sh` sometime after 07-23. Marked that task DONE.
  With the webintoapp cluster's known tasks all DONE/live, and per today's
  brief explicitly flagging `webintoapp` (2,376 imp, pos 6.5) as the system's
  #1 opportunity, did a fresh accuracy audit across the whole site (not just
  the already-touched blog post + `/alternatives/webintoapp` + homepage tiles
  + `/pricing` table) since stale numbers anywhere in this cluster undermine
  trust/consistency signals for the same query. Found and fixed 4 more stale
  WebIntoApp price mentions the 07-22/07-23 passes had missed because they
  live in *other* blog posts' own comparison tables, not the main comparison
  post:
  - `website-to-app-converter-complete-guide-2026` — comparison table row +
    a `### WebIntoApp ($16–$60/year)` subsection heading/body, both still
    describing a nonexistent annual-subscription model. Corrected to
    "Free (watermarked) / $89 one-time to unbrand" and rewrote the section
    body to match the verified free-tier-branding + $89-Dedicated-plan facts.
  - `convert-wordpress-website-to-android-app` — same stale `$16–$60/year`
    table cell, corrected the same way.
  - Homepage (`Landing.tsx`) — a SECOND, separate "Price Comparison" table
    (below the one already fixed 07-24) still showed WebIntoApp at
    `$16/yr` / `$60+` 1-year-cost; corrected to `Free (branded)` starting
    price and renamed the row to "Unbranding Cost: $89 once" (matches the
    real pricing model instead of a fictitious annual one).
  - `best-website-to-app-converters-2026` FAQ section — two mentions of
    WebsiteToApp's own price as a stale "$10" (actual current price is
    $25 one-time, per `Pricing.tsx`) inside "Can I convert for free?" and
    "Which supports AdMob?" answers that are exactly the kind of query
    intent overlapping today's brief's free-intent keywords; corrected both
    to $25 and added the WebIntoApp $89 contrast to the free-tier answer.
  Ran `npx tsc -b` clean after all edits (no type errors). Committed + pushed
  from scratch clone. `bash /opt/webtoapp/deploy.sh` not runnable here
  (root-owned, mode 600, expected) — left unverified live, noted below.
  Flag for human: after 4 separate rewrite/expand passes (07-21 CTR title,
  07-22 content expand, 07-23 dedicated-page refresh, 07-24 link
  audit+schema) `webintoapp` is still sitting at pos 6.5 / 1.4% CTR despite
  now being one of the most internally-consistent, well-linked, accurately-
  priced comparison clusters on the site — further on-page/content work is
  likely hitting diminishing returns; a link-building/backlink push or an
  actual SERP screenshot review is probably needed to move it further,
  similar to the indexchex CTR-stuck pattern.
- 2026-07-25 (plan-updater): reprioritized against today's daily SC brief. All 6
  Push-to-Page-1 targets (`exe to app` pos 5.1, `website to exe converter online
  free` pos 5.6, `website to exe converter` pos 6.0, `webtoexe` pos 6.1, `exe to
  app converter` pos 6.3, `webintoapp` pos 6.5 / 2,376 imp / 34 clicks) remain
  covered by existing tasks — the EXE/desktop cluster + CTR pass and
  `/blog/exe-to-app-converter-guide` (both DONE/verified live) cover `exe to
  app`, `website to exe converter`, `website to exe converter online free`,
  `webtoexe`, and `exe to app converter` (this post explicitly captures the
  `exe to app converter` variant per its original 07-20 description); the
  webintoapp comparison expand + free-push (DONE, verified live 07-23) and the
  still-open `/alternatives/webintoapp` refresh (BLOCKED ON DEPLOY, 2026-07-23,
  still the topmost undone task) cover `webintoapp` (today's biggest
  opportunity at 2,376 imp) — no new page task added, no duplicate created.
  Today's "Getting traction" trio (`webintoapp` 34 clicks pos 6.5, `websitetoapp`
  18 clicks pos 1.5, `webtoapp` 12 clicks pos 9.4) is identical in kind to what
  the P2 "reinforce Getting traction" link-audit task (DONE 2026-07-24) already
  covered — no new task needed. P2 free-intent funnel, P2 brand defense
  (`webtoapp`, DONE 2026-07-24), and P3 `html to app` remain outside today's
  brief's Push-to-Page-1 window — left deprioritized, no change. No other
  undone tasks target keywords outside today's brief.
- 2026-07-24 (3, agent): checked deploy status of the P1 `/alternatives/webintoapp`
  refresh first (still not live — grepped the current production bundle
  `index-DxEduXGR.js`, found the old `$16-$60` figure still present, no new
  CTR title string — confirmed `deploy.sh` is still root-owned/permission-denied
  here) — left that task as-is, not re-done, since the content work was
  already complete and it's genuinely blocked on a human ops deploy run, not
  on more agent work. With both P1 webintoapp tasks already built (just
  pending deploy), moved to the next topmost undone task: the P2 "reinforce
  getting traction" link audit (added earlier today by the plan-updater).
  Audited the existing link inventory (found `webintoapp` already
  well-reinforced via the BlogPost.tsx cluster-link rule + 3 other pages) —
  no new links added to avoid stuffing. Found and fixed a real bug instead:
  Landing.tsx's FAQ schema still quoted WebIntoApp's old `$149+/year` price,
  contradicting the corrected `$89 one-time` figure already live elsewhere on
  the same page. Also executed the P2 brand-defense task (`webtoapp` alias) in
  the same pass: added `alternateName` to both JSON-LD blocks on the homepage,
  and a visible (not hidden) "also known as WebToApp" mention in the
  site-wide footer — deliberately rejected a `sr-only` hidden-text approach
  first attempted, since invisible keyword stuffing risks a Google manual
  action. `npx tsc --noEmit` clean on both edited files. Committed + pushed
  from scratch clone (`/opt/webtoapp`'s local checkout has the standard
  broken-permissions issue). Not deployable/verifiable live from here
  (`deploy.sh` blocked) — flagged for ops along with the still-pending
  `/alternatives/webintoapp` deploy.
- 2026-07-24 (plan-updater): reprioritized against today's daily SC brief. All 6
  Push-to-Page-1 targets (`exe to app` pos 5.1, `website to exe converter online
  free` pos 5.6, `website to exe converter` pos 6.0, `webtoexe` pos 6.1,
  `webintoapp` pos 6.5 / 2,155 imp / 32 clicks, `webintoapp free` pos 7.0)
  remain covered by existing tasks — the EXE/desktop cluster + CTR pass and
  `/blog/exe-to-app-converter-guide` (both DONE/verified live) cover `exe to
  app`, `website to exe converter`, `website to exe converter online free`,
  and `webtoexe`; the webintoapp comparison expand + free-push (DONE, verified
  live 07-23) and the still-open `/alternatives/webintoapp` refresh (BLOCKED ON
  DEPLOY, 2026-07-23, still the topmost undone task) cover `webintoapp` (by far
  today's biggest opportunity at 2,155 imp) and `webintoapp free` — no new page
  task added, no duplicate created. Added a new P2 task to audit/add internal
  links reinforcing the three "Getting traction" queries (`webintoapp`,
  `websitetoapp`, `webtoapp`) called out in today's brief, since no existing
  task explicitly bundled all three for link reinforcement (distinct from the
  `webtoapp` brand-defense schema/H1 task, which stays as-is). P2 free-intent
  funnel, P2 brand defense (`webtoapp`), and P3 `html to app` target keywords
  outside today's brief's Push-to-Page-1 window (or, for `webtoapp`, are
  already under Getting Traction rather than Push-to-Page-1) — left
  deprioritized in their existing P2/P3 slots, no reordering needed since they
  were already below P1. No other undone tasks target keywords outside
  today's brief.
- 2026-07-23 (2, agent): executed today's #1 brief priority (`webintoapp`, pos
  6.6, 1,857 imp, 1.5% CTR). First confirmed via live-bundle grep
  (`index-Df-guIAG.js`) that the 07-22 blog-post expand (commit `532233f`) IS
  now live — ops ran deploy.sh at some point in the last day — marked both P1
  competitor-comparison tasks DONE. Then found the topmost *remaining*
  webintoapp-cluster gap: `/alternatives/webintoapp` (the dedicated comparison
  landing page, driven by `competitors.ts`) was never touched by the 07-22
  work and still carried stale/inaccurate WebIntoApp pricing (`$16–$60/year`
  subscription — re-verified via WebFetch of webintoapp.com/plans that this
  is wrong; WebIntoApp has no subscription tier, only Free-watermarked or
  $89-one-time-Dedicated) plus a stale `$10` WebsiteToApp price (actual is
  $25). Rewrote the `webintoapp` competitor entry (pricing/pros/cons/features/
  verdict/switchReasons) with correct figures and a new CTR-oriented
  title/meta calling out the concrete $89-vs-$25 branding-removal cost, since
  the brief flagged this keyword's CTR as anomalously low for its position.
  Synced the same corrected figures on the homepage (`Landing.tsx`) and
  `/pricing` comparison table (`Pricing.tsx`), which both link into this
  cluster and were showing numbers that contradicted the corrected blog post.
  `npx tsc -b` clean. Committed + pushed from scratch clone; `deploy.sh`
  not runnable here (root-owned). Left the new task BLOCKED ON DEPLOY (not
  yet verified live — too soon to check). Noted a same-class stale-`$10`-price
  issue on the other 4 competitor entries for a future run.
- 2026-07-23 (plan-updater): reprioritized against today's daily SC brief. All 6
  Push-to-Page-1 targets (`exe to app` pos 5.1, `website to exe converter online
  free` pos 5.6, `website to exe converter` pos 6.0, `webtoexe` pos 6.1,
  `webintoapp` pos 6.6 / 1,857 imp / 28 clicks, `webintoapp free` pos 7.0) remain
  covered by the existing P1 tasks (EXE/desktop hub + CTR pass,
  `/blog/exe-to-app-converter-guide`, and the webintoapp comparison
  expand/free-push tasks) — no new page task added. The two P1
  competitor-comparison tasks (expand `webintoapp-alternative-websitetoapp`,
  push `webintoapp free`) were last verified NOT yet live (2026-07-22, BLOCKED ON
  DEPLOY pending a human ops run of `deploy.sh`) — status carried forward
  unchanged; both still target keywords in today's brief, left at top priority.
  P2 free-intent funnel, P2 brand defense (`webtoapp`, pos 9.4 under Getting
  Traction, 12 clicks), and P3 `html to app` remain outside today's brief's
  Push-to-Page-1 window — left deprioritized, no change. No other undone tasks
  target keywords outside today's brief.
- 2026-07-22 (2, agent): executed the topmost undone tasks (P1 competitor
  comparison — expand `webintoapp-alternative-websitetoapp` + push
  `webintoapp free`). Verified WebIntoApp's real free-tier watermark/branding
  and $89 one-time unbranded pricing via WebFetch of webintoapp.com/plans
  (corrected a stale $5–$49/month claim), and its total lack of a desktop/
  .exe option, then expanded the comparison table, added a free-intent
  section, and cross-linked with the EXE/desktop cluster (`BlogPost.tsx`,
  `/pricing`, `/convert/website-to-exe`). Committed + pushed from scratch
  clone (`532233f`). Deploy blocked (`deploy.sh` permission denied, as
  expected) — confirmed NOT yet live via live-bundle grep, marked both tasks
  BLOCKED ON DEPLOY rather than DONE.
- 2026-07-22 (plan-updater): reprioritized against today's daily SC brief. All 6
  Push-to-Page-1 targets (`website to exe converter online free` pos 6.0,
  `webtoexe` pos 6.1, `website to exe converter` pos 6.3, `exe to app converter
  online` pos 6.6, `webintoapp` pos 6.7 / 1,615 imp / 28 clicks, `webintoapp
  free` pos 7.2) remain covered by the existing P1 tasks (EXE/desktop hub + CTR
  pass, the `/blog/exe-to-app-converter-guide` post, and the webintoapp
  comparison expand/free-push tasks) — no new page task added. The P1
  competitor-comparison tasks (expand webintoapp-alternative post, push
  webintoapp free) still target keywords in today's brief — left at top
  priority. P2 free-intent funnel, P2 brand defense (`webtoapp`, now pos 9.5
  under Getting Traction rather than Push-to-Page-1), and P3 `html to app`
  remain outside today's brief's Push-to-Page-1 window — left deprioritized, no
  change. No other undone tasks target keywords outside today's brief.
- 2026-07-21 (2, agent): closed out all 4 P1 EXE/desktop cluster bullets.
  (1) Confirmed the `/website-to-exe` hub task was already satisfied by the
  live `/convert/website-to-exe` page — marked DONE, no new page built.
  (2) Internal-linked the hub from the global footer (`PublicLayout.tsx`),
  `/pricing` (Desktop App Plans section), and the 3 desktop-cluster blog
  posts (`website-to-windows-desktop-app`, `exe-to-app-converter-guide`,
  `website-to-app-converter-complete-guide-2026`) — verified with `tsc -b`
  and a full `npm run build` (clean, no errors).
  (3) CTR pass: `/convert/website-to-exe` title/meta (via `ConvertPage.tsx`
  `useSEO` call) now explicitly include "Free" and "Online". Note: the
  post-build static-prerender script (`generate-static-pages.cjs`) does not
  currently generate a prerendered HTML file for `/convert/website-to-exe`
  at all (its own hardcoded platform list only covers `*-to-app` slugs) —
  the new title/meta only take effect once client JS hydrates. This is a
  pre-existing gap, left as-is (out of scope today) — worth a follow-up task
  to add `website-to-exe` to that script's platform list so Googlebot gets
  the prerendered version too.
  (4) Verified `/blog/exe-to-app-converter-guide` is now LIVE — downloaded
  the live production bundle `index-Cr457zTn.js` and grepped it for
  `exe-to-app-converter-guide` (found) rather than relying on a curl status
  check, since the SPA catch-all returns 200 for any path. Deploy is no
  longer blocked; marked DONE.
  Committed + pushed from a scratch clone (`/opt/webtoapp`'s working copy has
  broken git permissions). Deploy of *today's* changes still requires a
  human/ops run of `/opt/webtoapp/deploy.sh` (root-owned mode 600, same
  constraint as 07-20).
- 2026-07-21 (plan-updater): reprioritized against today's daily SC brief.
  All 6 Push-to-Page-1 targets (`exe to app` pos 5.0, `exe to app converter
  online` pos 5.9, `webtoexe` pos 6.1, `webintoapp` pos 6.7 / 1,411 imp / 23
  clicks, `webintoapp free` pos 7.3, `website to exe converter` pos 7.4)
  remain covered by the existing P1 tasks (EXE/desktop hub + CTR pass, the
  `/blog/exe-to-app-converter-guide` post added 07-20, and the webintoapp
  comparison expand/free-push tasks) — no new page task added. Deploy status
  for `/blog/exe-to-app-converter-guide` is unchanged from 07-20: still
  BLOCKED ON DEPLOY (`/opt/webtoapp/deploy.sh` root-owned mode 600), still
  needs human ops to run it. The P2 free-intent funnel and P3 `html to app`
  tasks remain outside today's brief's pos 5-15 window — left deprioritized,
  no change. No other undone tasks target keywords outside today's brief.
- 2026-07-20 (4, agent): built `/blog/exe-to-app-converter-guide` targeting
  the `exe to app` / `exe to app converter` reverse-intent cluster; committed
  + pushed (d6ce075). Deploy blocked — `/opt/webtoapp/deploy.sh` is
  root-owned mode 600, unreadable/unexecutable here. Live bundle still on
  `43ab2e4`, confirmed new content NOT yet live. Task left `[ ]` with a
  BLOCKED ON DEPLOY note; flagged for human ops to run deploy.sh.
- 2026-07-20 (3, plan-updater): reprioritized against today's daily SC brief.
  All existing P1 tasks (EXE/desktop hub, `exe to app converter online` CTR
  pass, webintoapp comparison expand + free push) already target keywords in
  today's brief — left in place. Added a new P1 task for the `exe to app` /
  `exe to app converter` reverse-conversion cluster (pos 5.0 / 6.6 per
  today's brief) — no existing page/slug covers this intent. Deprioritized
  the free-intent funnel (P2) and `html to app` (P3) tasks — both sit
  outside today's brief's pos 5-15 opportunity window.
- 2026-07-20 (2): afternoon GSC re-pull confirms baseline; `webintoapp` grew
  to 1,442 imp (pos 6.7) and `web to exe converter` (14 imp, pos 8.5) joins
  the EXE cluster — priorities unchanged, P1s stand.
- 2026-07-20: plan created from GSC 30-day pull (this file); wired into the
  nightly plan updater + seo agent.
