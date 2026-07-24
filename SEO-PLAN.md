# Last updated: 2026-07-24 by plan-updater based on SC data
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
- [ ] BLOCKED ON DEPLOY (2026-07-23, agent) — Refresh `/alternatives/webintoapp`
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
- [ ] Added 2026-07-24 (plan-updater) — Audit and add contextual internal links
      from additional blog posts / footer / pricing sections to the pages
      currently ranking for the three "getting traction" queries flagged in
      today's brief: `webintoapp` (pos 6.5, 2,155 imp, 32 clicks —
      `/blog/webintoapp-alternative-websitetoapp` +
      `/alternatives/webintoapp`), `websitetoapp` (pos 1.5, 17 clicks —
      homepage/brand), and `webtoapp` (pos 9.4, 12 clicks — homepage brand
      alias, see P2 brand-defense task below). Goal: reinforce pages already
      earning clicks rather than only chasing new pos 5-15 opportunities.
      Not yet checked against existing link inventory — verify what's already
      linked (the webintoapp comparison post already has several inbound
      links per the 2026-07-22 task) before adding more, to avoid link-stuffing.

### P2 — free-intent funnel (lower priority — not in today's brief's opportunity range)
- [ ] `/free-website-to-app-converter` landing (or optimize existing free
      trial page) targeting `website to app converter free` +
      `convert website to app for free` (≈300 imp at pos 25). Deprioritized
      2026-07-20: today's official brief's Push-to-Page-1 range is pos 5-15;
      these sit at pos ~25.5-25.7, outside it.

### P2 — brand defense
- [ ] `webtoapp` (pos 9.8): homepage title tag already has brand; add
      "WebToApp" alias in H1/subtitle + org schema alternateName.

### P3 — niche (lowest priority — not in today's brief either)
- [ ] `html to app` (pos 15.7): blog post "Turn an HTML site into an Android
      app" reusing the convert-flow screenshots.

## Update log
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
