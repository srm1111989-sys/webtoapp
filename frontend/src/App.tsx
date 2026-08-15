import { Routes, Route } from 'react-router-dom'
import FloatingSupportButton from '@/components/FloatingSupportButton'
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
import ComparisonPage from '@/pages/public/ComparisonPage'
import PlayStorePage from '@/pages/public/PlayStorePage'
import CustomDevPage from '@/pages/public/CustomDevPage'

// Auth pages
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import ForgotPassword from '@/pages/auth/ForgotPassword'
import ResetPassword from '@/pages/auth/ResetPassword'
import VerifyEmail from '@/pages/auth/VerifyEmail'

// User pages
import Dashboard from '@/pages/user/Dashboard'
import CreateApp from '@/pages/user/CreateApp'
import MyApps from '@/pages/user/MyApps'
import OrderDetail from '@/pages/user/OrderDetail'
import Orders from '@/pages/user/Orders'
import EditApp from '@/pages/user/EditApp'
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
import AdminProducts from '@/pages/admin/AdminProducts'
import AdminSales from '@/pages/admin/AdminSales'
import AdminSalesAnalytics from '@/pages/admin/AdminSalesAnalytics'
import AdminProjects from '@/pages/admin/AdminProjects'
import Settings from '@/pages/user/Settings'
import Subscription from '@/pages/user/Subscription'

export default function App() {
  return (
    <>
    <FloatingSupportButton />
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
        {/* Phase 2: Programmatic SEO — /convert-{keyword}-to-app */}
        <Route path="/convert-:slug" element={<ConvertPage />} />
        <Route path="/alternatives/:slug" element={<ComparisonPage />} />
        {/* Phase 4: /vs/ URL alias for comparison pages */}
        <Route path="/vs/:slug" element={<ComparisonPage />} />
        <Route path="/publish-app" element={<PlayStorePage />} />
        <Route path="/custom-app-development" element={<CustomDevPage />} />
      </Route>

      {/* Auth routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/reset-password" element={<ResetPassword />} />
        <Route path="/auth/verify" element={<VerifyEmail />} />
      </Route>

      {/* User routes (protected) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<UserLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/apps/create" element={<CreateApp />} />
          <Route path="/apps/:id/edit" element={<EditApp />} />
          <Route path="/apps/:id" element={<EditApp />} />
          <Route path="/apps" element={<MyApps />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/billing" element={<Subscription />} />
          <Route path="/settings" element={<Settings />} />
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
          <Route path="/admin/projects" element={<AdminProjects />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/builds" element={<AdminBuilds />} />
          <Route path="/admin/plans" element={<AdminPlans />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/sales" element={<AdminSales />} />
          <Route path="/admin/sales/analytics" element={<AdminSalesAnalytics />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
        </Route>
      </Route>
    </Routes>
    </>
  )
}
