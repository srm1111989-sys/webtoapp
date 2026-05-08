import { useState, useEffect, type FormEvent } from 'react'
import { MessageCircle, X, Send, Loader2, CheckCircle, AlertTriangle } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

export default function FloatingSupportButton() {
  const { user } = useAuthStore()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { if (user?.email) setEmail(user.email) }, [user?.email])

  useEffect(() => {
    if (!done) return
    const t = setTimeout(() => { setOpen(false); setDone(false); setSubject(''); setMessage('') }, 2500)
    return () => clearTimeout(t)
  }, [done])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // Hide on admin pages
  if (window.location.pathname.startsWith('/admin')) return null

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email.trim() || !subject.trim() || !message.trim()) {
      setError('All fields are required'); return
    }
    setSending(true)
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          subject,
          message,
          pageUrl: window.location.href,
          userAgent: navigator.userAgent,
          userId: user?.id || null,
          userEmail: user?.email || null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.detail || data.error || `Failed (${res.status})`)
      setDone(true)
    } catch (err: any) {
      setError(err.message || 'Failed to send. Please email support@websitetoapp.app directly.')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Contact support"
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-primary-600 text-white shadow-lg hover:bg-primary-700 hover:scale-105 transition-all"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="hidden sm:inline text-sm font-medium">Need help?</span>
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end p-0 sm:p-5 bg-black/40" onClick={() => !sending && setOpen(false)}>
          <div className="w-full sm:w-[420px] max-h-[90vh] bg-white border border-gray-200 rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-semibold flex items-center gap-2 text-gray-900">
                <MessageCircle className="w-5 h-5 text-primary-600" /> Need help?
              </h3>
              <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-900" disabled={sending}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {done ? (
              <div className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <p className="font-medium text-gray-900">Message sent</p>
                <p className="text-sm text-gray-500 mt-1">We'll reply within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={submit} className="p-4 space-y-3 overflow-y-auto">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Your email</label>
                  <input
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={sending}
                    placeholder="you@example.com"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Subject</label>
                  <input
                    type="text" value={subject} onChange={(e) => setSubject(e.target.value)} required disabled={sending}
                    maxLength={200}
                    placeholder="What's the issue?"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Message</label>
                  <textarea
                    value={message} onChange={(e) => setMessage(e.target.value)} required disabled={sending}
                    maxLength={5000} rows={5}
                    placeholder="Describe what you're trying to do and what went wrong…"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-primary-500 resize-none"
                  />
                </div>
                <p className="text-[11px] text-gray-500">
                  Page: <span className="font-mono">{window.location.pathname}</span>
                </p>
                {error && (
                  <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" /><span>{error}</span>
                  </div>
                )}
                <button
                  type="submit" disabled={sending}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary-600 text-white font-medium text-sm hover:bg-primary-700 disabled:opacity-50"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {sending ? 'Sending…' : 'Send message'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
