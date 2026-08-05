import '@fontsource-variable/inter'
import './index.css'
import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { captureFirstTouch } from '@/utils/attribution'
import { initTheme } from '@/lib/theme'

captureFirstTouch()
initTheme()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
})

function AppProviders() {
  const [googleClientId, setGoogleClientId] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    const loadGoogleClientId = async () => {
      try {
        const response = await fetch('/api/auth/google-client-id', { credentials: 'include' })
        if (!response.ok) return

        const data = await response.json()
        if (!cancelled) {
          setGoogleClientId(data?.clientId || '')
        }
      } catch {
        if (!cancelled) {
          setGoogleClientId('')
        }
      } finally {
        if (!cancelled) {
          setReady(true)
        }
      }
    }

    void loadGoogleClientId()

    return () => {
      cancelled = true
    }
  }, [])

  if (!ready) {
    return null
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
          <Toaster position="top-right" />
        </BrowserRouter>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  )
}

// t217: harden React against third-party DOM mutation (Google Translate,
// in-app-browser overlays, ad/extension injectors). Those rewrite text nodes
// React is managing, so React's later removeChild/insertBefore throws
// "NotFoundError: ... not a child of this node" and crashes the whole page —
// seen recurring on /apps/create and /apps/{id}/edit. Making these DOM calls
// tolerant is the standard, safe production guard.
if (typeof Node === 'function' && Node.prototype) {
  const origRemove = Node.prototype.removeChild
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child.parentNode !== this) {
      if (console && console.warn) console.warn('Guarded removeChild: node is not a child (third-party DOM mutation)')
      return child
    }
    // eslint-disable-next-line prefer-rest-params
    return origRemove.apply(this, arguments as any) as T
  }
  const origInsert = Node.prototype.insertBefore
  Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (console && console.warn) console.warn('Guarded insertBefore: reference node is not a child (third-party DOM mutation)')
      return newNode
    }
    // eslint-disable-next-line prefer-rest-params
    return origInsert.apply(this, arguments as any) as T
  }
}

// Capture browser console errors and send to backend for logging
function isNoiseError(message: string, source: string | undefined, stack: string | undefined): boolean {
  // Cross-origin script errors arrive as the opaque "Script error." with no
  // source/stack — unactionable (usually in-app browsers like WeChat/Line).
  if (/^Script error\.?$/i.test(message) && !source && !stack) return true
  // Third-party scripts erroring in their OWN code, not ours (Clarity, GTM,
  // ad/analytics injectors) — we can't fix these and they drown the log.
  const blob = (source || '') + ' ' + (stack || '')
  if (/clarity\.ms|googletagmanager|google-analytics|gtag\/js|doubleclick|facebook\.net|connect\.facebook/i.test(blob)) return true
  return false
}

function sendClientError(payload: Record<string, unknown>) {
  try {
    if (isNoiseError(String(payload.message ?? ''), payload.source ? String(payload.source) : undefined, payload.stack ? String(payload.stack) : undefined)) return
    // sendBeacon with a raw string sends Content-Type: text/plain, which FastAPI
    // rejects with 422 — every crash report was being silently discarded. A Blob
    // lets us set the JSON content type. Trailing slash avoids the 307 redirect.
    const body = new Blob([JSON.stringify(payload)], { type: 'application/json' })
    navigator.sendBeacon('/api/client-errors/', body)
  } catch (_) {}
}
window.onerror = (message, source, line, col, error) => {
  sendClientError({ type: 'js_error', message: String(message), source, line, col, stack: error?.stack, url: location.href, userAgent: navigator.userAgent })
}
window.addEventListener('unhandledrejection', (e) => {
  sendClientError({ type: 'unhandled_promise', message: String(e.reason), stack: e.reason?.stack, url: location.href, userAgent: navigator.userAgent })
})

// Hide pre-rendered SEO content once React takes over
const seoPrerender = document.getElementById('seo-prerender')
if (seoPrerender) seoPrerender.style.display = 'none'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders />
  </StrictMode>,
)
