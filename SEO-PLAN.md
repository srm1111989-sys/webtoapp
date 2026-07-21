# Last updated: 2026-07-21 by plan-updater based on SC data
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
- [ ] Build `/website-to-exe` hub page: H1 "Website to EXE Converter", covers
      web to exe / site to exe / webtoexe variants, live demo GIF, FAQ schema,
      links to /convert/website-to-desktop-app-to-app. Add to sitemap.
- [ ] Internal-link the hub from homepage footer + /pricing + the 3 desktop blogs.
- [ ] CTR pass on `exe to app converter online` (pos 5.9): title/meta of the
      current ranking page must say "online" + "free" explicitly.
- [ ] BLOCKED ON DEPLOY (2026-07-20, agent): dedicated page/section for the
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
      DEPLOY STATUS: content committed + pushed to `main` (commit d6ce075),
      but `/opt/webtoapp/deploy.sh` is root-owned mode 600 (unreadable AND
      unexecutable from this environment) — deploy could not run. Verified
      the live site is still serving the JS bundle tagged `43ab2e4` (several
      commits behind); confirmed the new slug is genuinely absent from that
      bundle (not just relying on the SPA catch-all's 200 for any path).
      **Needs a human/ops run of deploy.sh with proper permissions** — once
      deployed, verify `curl -sI https://websitetoapp.app/blog/exe-to-app-converter-guide`
      returns 200 AND the served JS bundle contains
      `exe-to-app-converter-guide`, then flip this line to `[x] DONE`.

### P1 — competitor comparison (biggest impression pool)
- [ ] Expand `/blog/webintoapp-alternative-websitetoapp` — add comparison
      table (price, watermark, build time, desktop EXE support), update date.
- [ ] Push `webintoapp free` (67 imp, pos 7.4): section targeting "free
      WebIntoApp alternative" inside the comparison post.

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
