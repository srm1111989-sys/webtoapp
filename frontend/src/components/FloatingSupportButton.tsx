import { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send, Loader2, AlertTriangle, Trash2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

interface Message {
  id: string
  role: 'user' | 'bot'
  text: string
}

export default function FloatingSupportButton() {
  const isEnabled = import.meta.env.VITE_ASK_AI_ENABLED === 'true'
  const { user, accessToken } = useAuthStore()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'bot',
      text: 'Hello! I am **WebsiteToApp Expert Assistant**. I can answer questions about converting websites into Android apps, check your app list/build status, or help submit a support ticket. Ask me anything!'
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Per-user conversation persistence (localStorage)
  const chatKey = () => 'wta_chat_' + (user?.id || (accessToken ? accessToken.slice(-24) : 'anon'))
  useEffect(() => {
    try {
      const raw = localStorage.getItem(chatKey())
      if (raw) { const saved = JSON.parse(raw); if (Array.isArray(saved) && saved.length) setMessages(saved) }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])
  useEffect(() => {
    try { localStorage.setItem(chatKey(), JSON.stringify(messages.slice(-50))) } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages])

  // Auto-scroll to bottom
  useEffect(() => {
    if (open) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, loading, open])

  // ESC to close
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // Hide on admin pages
  if (!isEnabled) return null
  if (window.location.pathname.startsWith('/admin')) return null

  // Top real support themes from chatbot analytics — shown as one-tap chips
  // at the start of a conversation so users don't face an empty box.
  const SUGGESTIONS = [
    'Where do I download my APK / AAB?',
    'How much does it cost?',
    'How do I publish to the Play Store?',
    'How do push notifications work?',
    'How do I set up my splash screen?',
  ]

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return
    await sendQuestion(input.trim())
  }

  const sendQuestion = async (userQuestion: string) => {
    if (loading) return
    const userMessage: Message = {
      id: Math.random().toString(),
      role: 'user',
      text: userQuestion
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({ question: userQuestion }),
      })

      const data = await res.json().catch(() => ({}))
      if (res.status === 401) {
        setMessages((prev) => [...prev, {
          id: Math.random().toString(),
          role: 'bot' as const,
          text: 'Please sign in to use support chat — use the Login button at the top right, then ask me again.'
        }])
        return
      }
      if (!res.ok) throw new Error(data.detail || data.error || `Error (${res.status})`)

      const botMessage: Message = {
        id: Math.random().toString(),
        role: 'bot',
        text: data.answer || 'I received empty content.'
      }
      setMessages((prev) => [...prev, botMessage])
    } catch (err: any) {
      console.error(err)
      const botError: Message = {
        id: Math.random().toString(),
        role: 'bot',
        text: `❌ **Error:** ${err.message || 'Support chat is unavailable right now.'}`
      }
      setMessages((prev) => [...prev, botError])
    } finally {
      setLoading(false)
    }
  }

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'bot',
        text: 'Chat cleared. How else can I help you today?'
      }
    ])
  }

  const parseMarkdown = (text: string) => {
    if (!text) return ''
    
    // Simple HTML escaping to avoid injections
    let escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

    // Bold (**text**)
    escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')

    // Markdown Links [text](url) -> custom styling with underline/indigo color
    escaped = escaped.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener" class="text-indigo-600 hover:text-indigo-800 underline font-medium">$1</a>'
    )

    // Line breaks
    escaped = escaped.replace(/\n/g, '<br>')
    
    return escaped
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Talk to an Expert"
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-primary-600 text-white shadow-lg hover:bg-primary-700 hover:scale-105 transition-all"
        >
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-white"></span>
          <MessageCircle className="w-5 h-5" />
          <span className="hidden sm:inline text-sm font-medium">Talk to an Expert</span>
        </button>
      )}

      {open && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end p-0 sm:p-5 bg-black/40" 
          onClick={() => !loading && setOpen(false)}
        >
          <div 
            className="w-full sm:w-[420px] h-[100vh] sm:h-[550px] max-h-[100vh] sm:max-h-[90vh] bg-white border border-gray-200 rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-semibold flex items-center gap-2 text-gray-900">
                <MessageCircle className="w-5 h-5 text-primary-600" /> WebsiteToApp Expert Assistant
                <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>online</span>
              </h3>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleClearChat} 
                  title="Clear chat"
                  className="text-gray-500 hover:text-red-600 p-1 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setOpen(false)} 
                  className="text-gray-500 hover:text-gray-900 p-1"
                  disabled={loading}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-grow p-4 space-y-4 overflow-y-auto bg-gray-100">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-primary-600 text-white rounded-br-none' 
                        : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                    }`}
                    dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.text) }}
                  />
                </div>
              ))}
              
              {messages.length <= 1 && !loading && (
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => sendQuestion(s)}
                      className="px-3 py-1.5 rounded-full border border-primary-300 bg-white text-primary-700 text-xs hover:bg-primary-50 transition-colors shadow-sm"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none px-4 py-3 text-sm shadow-sm flex items-center gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>

            {/* Footer Form */}
            <div className="p-3 border-t border-gray-200 bg-white">
              <form onSubmit={handleSend} className="flex gap-2">
                <input
                  type="text" 
                  value={input} 
                  onChange={(e) => setInput(e.target.value)} 
                  required 
                  disabled={loading}
                  placeholder="Ask a question..."
                  className="flex-grow px-4 py-2 rounded-full border border-gray-300 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                />
                <button
                  type="submit" 
                  disabled={loading || !input.trim()}
                  className="bg-primary-600 hover:bg-primary-700 text-white rounded-full p-2.5 flex items-center justify-center transition-colors disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
