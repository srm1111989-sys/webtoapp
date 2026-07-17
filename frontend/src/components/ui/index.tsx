/** Small reusable UI kit for the redesigned dashboard (Tailwind v4 tokens). */
import { useEffect, useRef, useState, type ReactNode, type ButtonHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import clsx from 'clsx'

/* ── Card ─────────────────────────────────────────────────────────────── */
export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={clsx('bg-surface border border-line rounded-2xl shadow-[0_1px_3px_rgba(16,24,40,0.06)]', className)}>
      {children}
    </div>
  )
}

export function CardHeader({ title, subtitle, action }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        {subtitle && <p className="text-xs text-soft mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

/* ── Badge / status pill ──────────────────────────────────────────────── */
const badgeTones: Record<string, string> = {
  gray: 'bg-gray-100 text-gray-600',
  blue: 'bg-primary-50 text-primary-700',
  green: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700',
  purple: 'bg-purple-50 text-purple-700',
}
export function Badge({ tone = 'gray', className, children }: { tone?: keyof typeof badgeTones; className?: string; children: ReactNode }) {
  return (
    <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap', badgeTones[tone], className)}>
      {children}
    </span>
  )
}

/* ── Buttons ──────────────────────────────────────────────────────────── */
type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
const btnStyles: Record<BtnVariant, string> = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm',
  secondary: 'bg-surface text-ink border border-line hover:bg-gray-50',
  ghost: 'text-soft hover:bg-gray-100 hover:text-ink',
  danger: 'bg-red-600 text-white hover:bg-red-700',
}
export function Button({ variant = 'primary', className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant }) {
  return (
    <button
      {...props}
      className={clsx(
        'inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none',
        btnStyles[variant],
        className,
      )}
    />
  )
}

/* ── Skeleton ─────────────────────────────────────────────────────────── */
export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('skeleton', className)} aria-hidden="true" />
}

/* ── Dropdown menu (lightweight, keyboard/outside-click aware) ────────── */
export function Menu({ button, children, align = 'right' }: { button: ReactNode; children: ReactNode; align?: 'left' | 'right' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])
  return (
    <div ref={ref} className="relative">
      <div onClick={() => setOpen((v) => !v)}>{button}</div>
      {open && (
        <div
          role="menu"
          className={clsx(
            'absolute z-50 mt-1.5 min-w-44 bg-surface border border-line rounded-xl shadow-lg py-1 animate-fade-up',
            align === 'right' ? 'right-0' : 'left-0',
          )}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  )
}

export function MenuItem({ onClick, className, children }: { onClick?: () => void; className?: string; children: ReactNode }) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className={clsx('w-full flex items-center gap-2 px-3 py-2 text-sm text-ink hover:bg-gray-100 text-left', className)}
    >
      {children}
    </button>
  )
}

/* ── Accordion section ────────────────────────────────────────────────── */
export function Accordion({ title, icon, subtitle, defaultOpen = false, badge, children }: {
  title: string; icon?: ReactNode; subtitle?: string; defaultOpen?: boolean; badge?: ReactNode; children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-surface border border-line rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        {icon && <span className="p-2 rounded-lg bg-primary-50 text-primary-600">{icon}</span>}
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-semibold text-ink">{title}</span>
          {subtitle && <span className="block text-xs text-soft mt-0.5">{subtitle}</span>}
        </span>
        {badge}
        <ChevronDown className={clsx('w-4 h-4 text-soft transition-transform', open && 'rotate-180')} />
      </button>
      {open && <div className="px-5 pb-5 animate-fade-up">{children}</div>}
    </div>
  )
}

/* ── Section header for pages ─────────────────────────────────────────── */
export function PageHeader({ title, subtitle, actions }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
      <div>
        <h1 className="text-xl font-bold text-ink tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-soft mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
