import './index.css'
import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { captureFirstTouch } from '@/utils/attribution'

captureFirstTouch()

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

// Capture browser console errors and send to backend for logging
function sendClientError(payload: object) {
  try {
    navigator.sendBeacon('/api/client-errors', JSON.stringify(payload))
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
