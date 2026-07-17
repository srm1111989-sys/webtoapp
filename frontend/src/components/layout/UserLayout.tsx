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
      <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 flex justify-between items-center h-14 sm:h-16">
          <Link to="/" className="flex items-center gap-1.5 sm:gap-2 text-base sm:text-lg lg:text-xl font-bold text-primary-600 hover:text-primary-700 transition">
            <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
            <span>WebsiteToApp</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs sm:text-sm text-gray-600 max-w-[150px] lg:max-w-none truncate">
              <User className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
              <span className="truncate">{user?.full_name}</span>
            </div>
            <button
              onClick={() => { logout(); window.location.href = '/login' }}
              className="text-gray-400 hover:text-gray-600 p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-8">
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
      <footer className="mt-8 sm:mt-12 mb-20 md:mb-0 border-t bg-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-primary-600 font-bold">
              <Smartphone className="w-5 h-5" />
              WebsiteToApp
            </div>
            <nav className="flex items-center gap-4 sm:gap-6 flex-wrap justify-center text-xs sm:text-sm">
              <Link to="/dashboard" className="text-gray-600 hover:text-primary-600 transition font-medium">Dashboard</Link>
              <Link to="/apps" className="text-gray-600 hover:text-primary-600 transition font-medium">My Apps</Link>
              <Link to="/orders" className="text-gray-600 hover:text-primary-600 transition font-medium">Orders</Link>
              <Link to="/pricing" className="text-gray-600 hover:text-primary-600 transition font-medium">Pricing</Link>
              <a href="mailto:support@websitetoapp.app" className="text-gray-600 hover:text-primary-600 transition font-medium">support@websitetoapp.app</a>
            </nav>
          </div>
          <p className="mt-4 text-center md:text-left text-xs text-gray-400">
            © {new Date().getFullYear()} WebsiteToApp · websitetoapp.app · Convert any website into a mobile or desktop app.
          </p>
        </div>
      </footer>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50 safe-area-pb shadow-lg">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={clsx(
                'flex flex-col items-center gap-1 px-3 py-2 min-w-0 rounded-lg transition-all',
                location.pathname === item.to
                  ? 'text-primary-600 bg-primary-50'
                  : 'text-gray-400 hover:text-gray-600'
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span className="text-[10px] font-semibold truncate max-w-[60px]">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}
