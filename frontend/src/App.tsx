import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './stores/auth'
import { useSetupStore } from './stores/setup'
import PublicLayout from './layouts/PublicLayout'
import PortalLayout from './layouts/PortalLayout'
import AdminLayout from './layouts/AdminLayout'

import Home from './pages/public/Home'
import Pricing from './pages/public/Pricing'
import About from './pages/public/About'
import Contact from './pages/public/Contact'
import Terms from './pages/public/Terms'
import Privacy from './pages/public/Privacy'
import RefundPolicy from './pages/public/RefundPolicy'
import CancellationPolicy from './pages/public/CancellationPolicy'
import ProductDetail from './pages/public/ProductDetail'
import CheckoutSuccess from './pages/public/CheckoutSuccess'
import CheckoutCancel from './pages/public/CheckoutCancel'

import Login from './pages/auth/Login'
import Register from './pages/auth/Register'

import SetupAdmin from './pages/setup/SetupAdmin'

import Dashboard from './pages/portal/Dashboard'
import Orders from './pages/portal/Orders'
import OrderDetail from './pages/portal/OrderDetail'
import Services from './pages/portal/Services'
import ServiceDetail from './pages/portal/ServiceDetail'
import Invoices from './pages/portal/Invoices'
import InvoiceDetail from './pages/portal/InvoiceDetail'
import BillingMethods from './pages/portal/BillingMethods'
import Security from './pages/portal/Security'
import Cart from './pages/portal/Cart'

import AdminDashboard from './pages/admin/AdminDashboard'
import AdminProducts from './pages/admin/AdminProducts'
import AdminOrders from './pages/admin/AdminOrders'
import AdminInvoices from './pages/admin/AdminInvoices'
import AdminPayments from './pages/admin/AdminPayments'
import AdminCustomers from './pages/admin/AdminCustomers'
import AdminSystem from './pages/admin/AdminSystem'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />
  if (user && user.role !== 'admin') return <Navigate to="/portal/dashboard" replace />
  return <>{children}</>
}

function SetupGuard({ children }: { children: React.ReactNode }) {
  const { needsSetup, isChecking } = useSetupStore()
  const location = useLocation()

  // 还在检测中，显示空白避免闪烁
  if (isChecking || needsSetup === null) return null

  // 需要 setup 且当前不在 /setup 页面 → 强制跳转
  if (needsSetup && location.pathname !== '/setup') {
    return <Navigate to="/setup" replace />
  }

  // 不需要 setup 但访问了 /setup → 禁止访问
  if (!needsSetup && location.pathname === '/setup') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export default function App() {
  const { loadUser, token } = useAuthStore()
  const { checkSetupStatus } = useSetupStore()

  useEffect(() => {
    checkSetupStatus()
  }, [checkSetupStatus])

  useEffect(() => {
    if (token) loadUser()
  }, [token, loadUser])

  return (
    <SetupGuard>
      <Routes>
        {/* Setup page */}
        <Route path="/setup" element={<SetupAdmin />} />

        {/* Public pages */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          <Route path="/cancellation-policy" element={<CancellationPolicy />} />
          <Route path="/vps/:slug" element={<ProductDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/checkout/success" element={<CheckoutSuccess />} />
          <Route path="/checkout/cancel" element={<CheckoutCancel />} />
        </Route>

        {/* Portal (authenticated) */}
        <Route element={<ProtectedRoute><PortalLayout /></ProtectedRoute>}>
          <Route path="/portal/dashboard" element={<Dashboard />} />
          <Route path="/portal/orders" element={<Orders />} />
          <Route path="/portal/orders/:id" element={<OrderDetail />} />
          <Route path="/portal/services" element={<Services />} />
          <Route path="/portal/services/:id" element={<ServiceDetail />} />
          <Route path="/portal/invoices" element={<Invoices />} />
          <Route path="/portal/invoices/:id" element={<InvoiceDetail />} />
          <Route path="/portal/billing" element={<BillingMethods />} />
          <Route path="/portal/security" element={<Security />} />
          <Route path="/portal/cart" element={<Cart />} />
        </Route>

        {/* Admin */}
        <Route element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/invoices" element={<AdminInvoices />} />
          <Route path="/admin/payments" element={<AdminPayments />} />
          <Route path="/admin/customers" element={<AdminCustomers />} />
          <Route path="/admin/system" element={<AdminSystem />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SetupGuard>
  )
}
