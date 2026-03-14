import { Routes, Route } from 'react-router-dom'
import PublicLayout from '@/components/layout/PublicLayout'
import AuthLayout from '@/components/layout/AuthLayout'
import UserLayout from '@/components/layout/UserLayout'
import AdminLayout from '@/components/layout/AdminLayout'
import ProtectedRoute from '@/components/layout/ProtectedRoute'

// Public pages
import Landing from '@/pages/public/Landing'
import Features from '@/pages/public/Features'
import Pricing from '@/pages/public/Pricing'
import PrivacyPolicy from '@/pages/public/PrivacyPolicy'
import TermsOfService from '@/pages/public/TermsOfService'
import RefundPolicy from '@/pages/public/RefundPolicy'
import Contact from '@/pages/public/Contact'
import Blog from '@/pages/public/Blog'
import BlogPost from '@/pages/public/BlogPost'
import ConvertPage from '@/pages/public/ConvertPage'

// Auth pages
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import ForgotPassword from '@/pages/auth/ForgotPassword'
import ResetPassword from '@/pages/auth/ResetPassword'

// User pages
import Dashboard from '@/pages/user/Dashboard'
import CreateApp from '@/pages/user/CreateApp'
import MyApps from '@/pages/user/MyApps'
import OrderDetail from '@/pages/user/OrderDetail'
import Orders from '@/pages/user/Orders'
// Payment pages
import PaymentSuccess from '@/pages/payment/PaymentSuccess'
import PaymentCancel from '@/pages/payment/PaymentCancel'

// Admin pages
import AdminLogin from '@/pages/admin/AdminLogin'
import AdminDashboard from '@/pages/admin/AdminDashboard'
import AdminUsers from '@/pages/admin/AdminUsers'
import AdminOrders from '@/pages/admin/AdminOrders'
import AdminBuilds from '@/pages/admin/AdminBuilds'
import AdminPlans from '@/pages/admin/AdminPlans'
import AdminSettings from '@/pages/admin/AdminSettings'

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/features" element={<Features />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/refund-policy" element={<RefundPolicy />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/convert/:slug" element={<ConvertPage />} />
      </Route>

      {/* Auth routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/reset-password" element={<ResetPassword />} />
      </Route>

      {/* User routes (protected) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<UserLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/apps/create" element={<CreateApp />} />
          <Route path="/apps" element={<MyApps />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
        </Route>
      </Route>

      {/* Payment routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<UserLayout />}>
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/cancel" element={<PaymentCancel />} />
        </Route>
      </Route>

      {/* Admin routes */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route element={<ProtectedRoute admin />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/builds" element={<AdminBuilds />} />
          <Route path="/admin/plans" element={<AdminPlans />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
        </Route>
      </Route>
    </Routes>
  )
}
