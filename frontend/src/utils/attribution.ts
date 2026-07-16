/**
 * First-touch attribution: recorded once on the visitor's first page load and
 * attached to signup so we know where each new user came from
 * (e.g. utm_source=chatgpt.com, google organic, a referring site) and the
 * keyword (utm_term) when the channel provides one.
 */
const KEY = 'wta_first_touch'

export interface Attribution {
  source: string
  medium?: string
  campaign?: string
  keyword?: string
  referrer?: string
  landing?: string
  ts?: string
}

export function captureFirstTouch(): void {
  try {
    if (localStorage.getItem(KEY)) return
    const params = new URLSearchParams(window.location.search)
    let source = params.get('utm_source') || ''
    const referrer = document.referrer || ''
    if (!source && referrer) {
      try {
        const host = new URL(referrer).hostname
        if (host && !host.endsWith('websitetoapp.app')) source = host
      } catch { /* invalid referrer */ }
    }
    const att: Attribution = {
      source: (source || 'direct').slice(0, 100),
      medium: (params.get('utm_medium') || '').slice(0, 100) || undefined,
      campaign: (params.get('utm_campaign') || '').slice(0, 100) || undefined,
      keyword: (params.get('utm_term') || params.get('q') || '').slice(0, 150) || undefined,
      referrer: referrer.slice(0, 300) || undefined,
      landing: (window.location.pathname + window.location.search).slice(0, 300),
      ts: new Date().toISOString(),
    }
    localStorage.setItem(KEY, JSON.stringify(att))
  } catch { /* storage unavailable — attribution is best-effort */ }
}

export function getAttribution(): Attribution | undefined {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : undefined
  } catch {
    return undefined
  }
}
