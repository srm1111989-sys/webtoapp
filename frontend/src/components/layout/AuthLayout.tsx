import { Outlet, Link } from 'react-router-dom'
import { Smartphone } from 'lucide-react'

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 text-2xl font-bold text-primary-600">
          <Smartphone className="w-8 h-8" />
          WebToApp
        </Link>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-xl sm:px-10">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
