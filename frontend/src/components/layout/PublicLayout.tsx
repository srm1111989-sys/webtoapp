import { useState } from 'react'
import { Outlet, Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Smartphone, Menu, X } from 'lucide-react'

export default function PublicLayout() {
  const { accessToken } = useAuthStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2 text-xl font-bold text-primary-600">
              <Smartphone className="w-6 h-6" />
              WebToApp
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/features" className="text-gray-600 hover:text-gray-900">Features</Link>
              <Link to="/pricing" className="text-gray-600 hover:text-gray-900">Pricing</Link>
              <Link to="/blog" className="text-gray-600 hover:text-gray-900">Blog</Link>
            </nav>
            <div className="flex items-center gap-3">
              {accessToken ? (
                <Link to="/dashboard" className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 text-sm">
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/login" className="hidden sm:inline text-gray-600 hover:text-gray-900 text-sm">Login</Link>
                  <Link to="/register" className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 text-sm">
                    Get Started
                  </Link>
                </>
              )}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-600 hover:text-gray-900"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-white">
            <nav className="flex flex-col px-4 py-3 space-y-1">
              <Link to="/features" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 text-sm">Features</Link>
              <Link to="/pricing" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 text-sm">Pricing</Link>
              <Link to="/blog" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 text-sm">Blog</Link>
              {!accessToken && (
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 text-sm sm:hidden">Login</Link>
              )}
            </nav>
          </div>
        )}
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-semibold mb-3">Product</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/features" className="hover:text-white">Features</Link></li>
                <li><Link to="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link to="/blog" className="hover:text-white">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-3">Company</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/contact" className="hover:text-white">Contact Us</Link></li>
                <li><Link to="/pricing" className="hover:text-white">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-3">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/privacy-policy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-white">Terms of Service</Link></li>
                <li><Link to="/refund-policy" className="hover:text-white">Refund Policy</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-3">Support</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="mailto:support@webtoapp.com" className="hover:text-white">support@webtoapp.com</a></li>
                <li><Link to="/contact" className="hover:text-white">Help Center</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm">
            &copy; {new Date().getFullYear()} WebToApp. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
