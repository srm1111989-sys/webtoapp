# Backlink Plan — websitetoapp.app — July 2026

Positioning: fastest website→Android app converter with push notifications and Play Store help.
Audience: small-business owners, freelancers/agencies, indie hackers, Shopify/WordPress users.

## Target pages
1. `/` — "website to app", "convert website to android app"
2. Pricing page — "$19 website to app" price hook
3. Blog/how-to pages (Play Store publishing guides convert best)

## Tier 1 — Listings (one-time)
| Target | Angle |
|---|---|
| alternativeto.net (vs Median/GoNative, WebViewGold, Appy Pie) | Cheaper + Play upload help |
| producthunt | Launch/refresh with demo video |
| saashub.com, betalist, indiehackers products | Free listings |
| g2/capterra "app builder" category | Free listing |
| github awesome-webview / android lists | Only if we publish an OSS wrapper sample |

## Tier 2 — Communities (existing scripts: reddit rotation, Quora Thu/Fri)
- **r/smallbusiness, r/Entrepreneur, r/ecommerce** — "do I need an app for my store?" threads;
  honest answer + tool mention. (Existing LeadDiscovery already surfaces these — note: its Reddit
  RSS polling is currently 429-limited, see fix note below.)
- **r/shopify, r/woocommerce, r/wordpress** — "wrap my store as an app" questions appear daily.
- **Quora**: "how to convert my website into an app without coding" cluster — post_backlinks_v3.py.
- **Facebook groups** for local-business owners (manual, 1/week).

## Tier 3 — Content placements
- dev.to: "TWA vs WebView in 2026 — what Google Play actually accepts" (technical credibility)
- Medium: "From website to Play Store in one day: checklist" → publishing guide
- YouTube short: screen-record a 60s conversion; link in description.
- Cross-site: contextual mentions from modbussimulator.com + indexflow.net blogs (existing rule:
  1-2 per post, never footer links).

## Tier 4 — Product-led
- Free "Play Store asset generator" (icon/splash resizer) page — evergreen link magnet.
- Public app gallery (customer apps with permission) — social proof + long-tail pages.

## Ops note (found tonight)
LeadDiscovery worker's Reddit RSS fetches are all returning **429** (unauthenticated RSS at
30-min intervals from a datacenter IP). Fix: add OAuth-authenticated Reddit API (60 req/min free)
or route RSS via the existing Smartproxy pool + back off to hourly with jitter — otherwise the
lead pipeline is running blind.

## Cadence & measurement
- 3 community answers/day (rotation), 1 placement/week, Tier 1 by Jul 20.
- Track "website to app" keyword set in GSC weekly; referral signups tagged by UTM.
