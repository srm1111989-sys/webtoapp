import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { LayoutDashboard, Plus, AppWindow, ShoppingCart, LogOut, Smartphone, User } from 'lucide-react'
import { clsx } from 'clsx'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/apps/create', label: 'Create App', icon: Plus },
  { to: '/apps', label: 'My Apps', icon: AppWindow },
  { to: '/orders', label: 'Orders', icon: ShoppingCart },
]

export default function UserLayout() {
  const location = useLocation()
  const { user, logout } = useAuthStore()

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      {/* Top nav */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-14 sm:h-16">
          <Link to="/" className="flex items-center gap-2 text-lg sm:text-xl font-bold text-primary-600 hover:text-primary-700 transition">
            <Smartphone className="w-5 h-5 sm:w-6 sm:h-6" />
            WebToApp
          </Link>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
              <User className="w-4 h-4" />
              {user?.full_name}
            </div>
            <button onClick={() => { logout(); window.location.href = '/login' }} className="text-gray-400 hover:text-gray-600">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="flex gap-8">
          {/* Sidebar — hidden on mobile */}
          <aside className="hidden md:block w-56 shrink-0">
            <nav className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium',
                    location.pathname === item.to
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 mb-20 md:mb-8 border-t bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <p className="text-sm text-gray-600">
                © {new Date().getFullYear()} WebToApp. All rights reserved.
              </p>
            </div>
            <div className="flex items-center gap-6">
              <Link
                to="/"
                className="text-sm text-gray-600 hover:text-primary-600 transition font-medium"
              >
                Home
              </Link>
              <a
                href="mailto:support@websitetoapp.app"
                className="text-sm text-gray-600 hover:text-primary-600 transition inline-flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                support@websitetoapp.app
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50 safe-area-pb">
        <div className="flex justify-around items-center h-14">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={clsx(
                'flex flex-col items-center gap-0.5 px-2 py-1 min-w-0',
                location.pathname === item.to
                  ? 'text-primary-600'
                  : 'text-gray-400'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium truncate">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}
