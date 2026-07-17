import { useMemo, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { clsx } from 'clsx'
import { useAuthStore } from '@/store/authStore'
import { appsApi } from '@/api/apps'
import { ordersApi } from '@/api/orders'
import { Menu, MenuItem } from '@/components/ui'
import { THEMES, applyTheme, getTheme } from '@/lib/theme'
import {
  LayoutDashboard, Plus, AppWindow, ShoppingCart, CreditCard, BookOpen, LifeBuoy, Settings as SettingsIcon,
  Smartphone, LogOut, Search, Bell, HelpCircle, ChevronDown, Palette, User as UserIcon,
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, external: false },
  { to: '/apps/create', label: 'Create App', icon: Plus, external: false },
  { to: '/apps', label: 'My Apps', icon: AppWindow, external: false },
  { to: '/orders', label: 'Orders', icon: ShoppingCart, external: false },
  { to: '/billing', label: 'Billing', icon: CreditCard, external: false },
  { to: '/blog/website-to-app-faq', label: 'Documentation', icon: BookOpen, external: false },
  { to: 'mailto:support@websitetoapp.app', label: 'Support', icon: LifeBuoy, external: true },
  { to: '/settings', label: 'Settings', icon: SettingsIcon, external: false },
]

function NavLink({ item, active }: { item: (typeof navItems)[number]; active: boolean }) {
  const cls = clsx(
    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
    active ? 'bg-primary-50 text-primary-700' : 'text-soft hover:bg-gray-100 hover:text-ink',
  )
  if (item.external) {
    return (
      <a href={item.to} className={cls}>
        <item.icon className="w-[18px] h-[18px]" />
        {item.label}
      </a>
    )
  }
  return (
    <Link to={item.to} className={cls} aria-current={active ? 'page' : undefined}>
      <item.icon className="w-[18px] h-[18px]" />
      {item.label}
    </Link>
  )
}

function SearchBox() {
  const [q, setQ] = useState('')
  const navigate = useNavigate()
  const { data: appsData } = useQuery({ queryKey: ['apps'], queryFn: () => appsApi.list(), select: (r) => r.data })
  const { data: ordersData } = useQuery({ queryKey: ['orders'], queryFn: () => ordersApi.list(1, 100), select: (r) => r.data })

  const results = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (term.length < 2) return []
    const apps = (appsData?.apps ?? [])
      .filter((a) => a.status !== 'draft' && (a.name.toLowerCase().includes(term) || a.url.toLowerCase().includes(term)))
      .slice(0, 4)
      .map((a) => ({ id: a.id, label: a.name, sub: a.url, to: `/apps/${a.id}/edit`, kind: 'App' }))
    const orders = (ordersData?.orders ?? [])
      .filter((o) => (o.order_number + ' ' + (o.app_name || '')).toLowerCase().includes(term))
      .slice(0, 4)
      .map((o) => ({ id: o.id, label: o.order_number, sub: o.app_name || '', to: `/orders/${o.id}`, kind: 'Order' }))
    return [...apps, ...orders]
  }, [q, appsData, ordersData])

  return (
    <div className="relative hidden md:block w-64 lg:w-80">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-soft pointer-events-none" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search apps and orders…"
        aria-label="Search apps and orders"
        className="w-full pl-9 pr-3 py-2 rounded-lg bg-gray-100 border border-transparent focus:bg-surface focus:border-line text-sm text-ink placeholder:text-soft transition"
      />
      {results.length > 0 && (
        <div className="absolute top-full mt-1.5 left-0 right-0 bg-surface border border-line rounded-xl shadow-lg py-1 z-50 animate-fade-up">
          {results.map((r) => (
            <button
              key={r.kind + r.id}
              onClick={() => { setQ(''); navigate(r.to) }}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 text-left"
            >
              <span className="text-[10px] font-bold uppercase tracking-wide text-soft w-10 shrink-0">{r.kind}</span>
              <span className="text-sm text-ink truncate">{r.label}</span>
              <span className="text-xs text-soft truncate">{r.sub}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Notifications() {
  const { data: ordersData } = useQuery({ queryKey: ['orders'], queryFn: () => ordersApi.list(1, 10), select: (r) => r.data })
  const navigate = useNavigate()
  const recent = (ordersData?.orders ?? []).slice(0, 5)
  return (
    <Menu
      button={
        <button aria-label="Notifications" className="relative p-2 rounded-lg text-soft hover:bg-gray-100 hover:text-ink transition">
          <Bell className="w-[18px] h-[18px]" />
          {recent.some((o) => o.plan_state === 'pending_payment') && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500" />
          )}
        </button>
      }
    >
      <p className="px-3 py-2 text-xs font-semibold text-soft uppercase tracking-wide">Recent activity</p>
      {recent.length === 0 && <p className="px-3 py-2 text-sm text-soft">Nothing yet</p>}
      {recent.map((o) => (
        <MenuItem key={o.id} onClick={() => navigate(`/orders/${o.id}`)}>
          <span className="flex-1 min-w-0">
            <span className="block text-sm truncate">{o.app_name || o.order_number}</span>
            <span className="block text-xs text-soft">
              {o.plan_state === 'paid' ? 'Paid plan active' :
               o.plan_state === 'pending_payment' ? 'Payment pending' :
               o.plan_state === 'free_expired' ? 'Trial ended' :
               o.plan_state === 'free_trial' ? `Trial — ${o.trial_days_left} days left` : o.status}
            </span>
          </span>
        </MenuItem>
      ))}
    </Menu>
  )
}

export default function UserLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const doLogout = () => { logout(); window.location.href = '/login' }
  const cycleTheme = () => {
    const ids = THEMES.map((t) => t.id)
    const next = ids[(ids.indexOf(getTheme()) + 1) % ids.length]
    applyTheme(next)
  }

  return (
    <div className="min-h-screen bg-app pb-16 md:pb-0">
      {/* ── Sidebar (desktop) ── */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-60 flex-col bg-surface border-r border-line z-40">
        <Link to="/dashboard" className="flex items-center gap-2 px-5 h-16 border-b border-line text-primary-600 font-bold text-lg shrink-0">
          <span className="p-1.5 rounded-lg bg-primary-600 text-white"><Smartphone className="w-4 h-4" /></span>
          WebsiteToApp
        </Link>
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Main">
          {navItems.map((item) => (
            <NavLink key={item.label} item={item} active={location.pathname === item.to} />
          ))}
        </nav>
        <div className="border-t border-line p-3 space-y-1 shrink-0">
          <button onClick={cycleTheme} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-soft hover:bg-gray-100 hover:text-ink transition">
            <Palette className="w-[18px] h-[18px]" /> Switch theme
          </button>
          <div className="flex items-center gap-2.5 px-3 py-2">
            <span className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold shrink-0">
              {(user?.full_name || 'U').slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-ink truncate">{user?.full_name || 'Account'}</span>
              <span className="block text-xs text-soft truncate">{user?.email}</span>
            </span>
            <button onClick={doLogout} aria-label="Log out" className="p-1.5 rounded-lg text-soft hover:bg-gray-100 hover:text-red-600 transition">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Top bar ── */}
      <header className="sticky top-0 z-30 md:ml-60 bg-surface/90 backdrop-blur border-b border-line">
        <div className="flex items-center gap-3 h-14 sm:h-16 px-4 lg:px-6 max-w-[1500px]">
          <Link to="/dashboard" className="md:hidden flex items-center gap-1.5 text-primary-600 font-bold">
            <Smartphone className="w-5 h-5" /> WebsiteToApp
          </Link>
          <SearchBox />
          <div className="flex-1" />
          <Notifications />
          <Link to="/blog/website-to-app-faq" aria-label="Help" className="hidden sm:block p-2 rounded-lg text-soft hover:bg-gray-100 hover:text-ink transition">
            <HelpCircle className="w-[18px] h-[18px]" />
          </Link>
          <Link
            to="/apps/create"
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> Create App
          </Link>
          <Menu
            button={
              <button aria-label="Profile menu" className="flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-gray-100 transition">
                <span className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">
                  {(user?.full_name || 'U').slice(0, 1).toUpperCase()}
                </span>
                <ChevronDown className="hidden sm:block w-3.5 h-3.5 text-soft" />
              </button>
            }
          >
            <MenuItem onClick={() => navigate('/settings')}><UserIcon className="w-4 h-4" /> Settings</MenuItem>
            <MenuItem onClick={() => navigate('/billing')}><CreditCard className="w-4 h-4" /> Billing</MenuItem>
            <MenuItem onClick={doLogout} className="text-red-600"><LogOut className="w-4 h-4" /> Log out</MenuItem>
          </Menu>
        </div>
      </header>

      {/* ── Main ── */}
      <div className="md:ml-60">
        <main className="max-w-[1500px] px-4 py-5 lg:px-6 lg:py-8 min-h-[70vh]">
          <Outlet />
        </main>

        {/* ── Footer ── */}
        <footer className="mt-8 border-t border-line bg-surface">
          <div className="max-w-[1500px] px-4 lg:px-6 py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-primary-600 font-bold">
                <Smartphone className="w-5 h-5" /> WebsiteToApp
              </div>
              <nav className="flex items-center gap-4 sm:gap-6 flex-wrap justify-center text-xs sm:text-sm" aria-label="Footer">
                <Link to="/dashboard" className="text-soft hover:text-primary-600 transition font-medium">Dashboard</Link>
                <Link to="/apps" className="text-soft hover:text-primary-600 transition font-medium">My Apps</Link>
                <Link to="/orders" className="text-soft hover:text-primary-600 transition font-medium">Orders</Link>
                <Link to="/pricing" className="text-soft hover:text-primary-600 transition font-medium">Pricing</Link>
                <a href="mailto:support@websitetoapp.app" className="text-soft hover:text-primary-600 transition font-medium">support@websitetoapp.app</a>
              </nav>
            </div>
            <p className="mt-4 text-center md:text-left text-xs text-soft/70">
              © {new Date().getFullYear()} WebsiteToApp · websitetoapp.app · Convert any website into a mobile or desktop app.
            </p>
          </div>
        </footer>
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-line z-50 shadow-lg" aria-label="Primary">
        <div className="flex justify-around items-center h-16 px-2">
          {[navItems[0], navItems[2], navItems[1], navItems[3], navItems[7]].map((item) => {
            const active = location.pathname === item.to
            return (
              <Link
                key={item.label}
                to={item.to}
                className={clsx('flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-medium', active ? 'text-primary-600' : 'text-soft')}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
