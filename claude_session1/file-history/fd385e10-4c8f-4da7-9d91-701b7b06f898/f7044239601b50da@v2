import { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { LayoutDashboard, Users, ShoppingCart, Hammer, CreditCard, Settings, LogOut, Smartphone, Menu, X } from 'lucide-react'
import { clsx } from 'clsx'
import { useSEO } from '@/hooks/useSEO'

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/admin/builds', label: 'Builds', icon: Hammer },
  { to: '/admin/plans', label: 'Plans', icon: CreditCard },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function AdminLayout() {
  const location = useLocation()
  const { logout } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Prevent admin pages from being indexed by search engines
  useSEO({
    title: 'Admin Dashboard',
    noindex: true
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header */}
      <header className="md:hidden bg-gray-900 text-white flex items-center justify-between px-4 h-14 sticky top-0 z-50">
        <Link to="/admin" className="flex items-center gap-2 text-lg font-bold">
          <Smartphone className="w-5 h-5" />
          Admin
        </Link>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2">
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      <div className="flex">
        {/* Sidebar overlay on mobile */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <aside className={clsx(
          'fixed md:sticky top-0 left-0 z-50 md:z-auto w-64 h-screen bg-gray-900 text-white flex flex-col transition-transform duration-200',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}>
          <div className="hidden md:flex p-4 border-b border-gray-800">
            <Link to="/admin" className="flex items-center gap-2 text-lg font-bold">
              <Smartphone className="w-6 h-6" />
              Admin Panel
            </Link>
          </div>
          {/* Spacer for mobile header */}
          <div className="h-14 md:hidden" />
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm',
                  location.pathname === item.to
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-gray-800">
            <button
              onClick={() => { logout(); window.location.href = '/admin/login' }}
              className="flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:text-white w-full"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-auto min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
