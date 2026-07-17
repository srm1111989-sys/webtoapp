/** Runtime theme switcher — themes are CSS-variable palettes in index.css. */

export interface ThemeDef {
  id: string
  label: string
  swatch: [string, string, string] // primary, app bg, surface — for the picker preview
  dark?: boolean
}

export const THEMES: ThemeDef[] = [
  { id: 'vercel', label: 'Vercel Enterprise', swatch: ['#2563eb', '#fafafa', '#ffffff'] },
  { id: 'stripe', label: 'Stripe', swatch: ['#635bff', '#f6f9fc', '#ffffff'] },
  { id: 'linear', label: 'Linear (Dark)', swatch: ['#5b8cff', '#09090b', '#18181b'], dark: true },
  { id: 'github', label: 'GitHub Modern', swatch: ['#0969da', '#f6f8fa', '#ffffff'] },
  { id: 'apple', label: 'Apple Minimal', swatch: ['#007aff', '#f5f5f7', '#ffffff'] },
  { id: 'indigo', label: 'Indigo + Emerald', swatch: ['#4f46e5', '#f8fafc', '#ffffff'] },
]

const KEY = 'wta_theme'

export function getTheme(): string {
  try {
    return localStorage.getItem(KEY) || 'vercel'
  } catch {
    return 'vercel'
  }
}

export function applyTheme(id: string): void {
  const theme = THEMES.some((t) => t.id === id) ? id : 'vercel'
  if (theme === 'vercel') {
    delete document.documentElement.dataset.theme
  } else {
    document.documentElement.dataset.theme = theme
  }
  try {
    localStorage.setItem(KEY, theme)
  } catch { /* private mode */ }
}

export function initTheme(): void {
  applyTheme(getTheme())
}
