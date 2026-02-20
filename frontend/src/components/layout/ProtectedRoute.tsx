import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

interface Props {
  admin?: boolean
}

export default function ProtectedRoute({ admin }: Props) {
  const { accessToken, isAdmin } = useAuthStore()

  if (!accessToken) {
    return <Navigate to={admin ? '/admin/login' : '/login'} replace />
  }

  if (admin && !isAdmin) {
    return <Navigate to="/admin/login" replace />
  }

  return <Outlet />
}
