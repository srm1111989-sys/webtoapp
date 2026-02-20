import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { LayoutDashboard, Users, ShoppingCart, Hammer, CreditCard, Settings, LogOut, Smartphone } from 'lucide-react'
import { clsx } from 'clsx'

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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <Link to="/admin" className="flex items-center gap-2 text-lg font-bold">
            <Smartphone className="w-6 h-6" />
            Admin Panel
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
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
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
