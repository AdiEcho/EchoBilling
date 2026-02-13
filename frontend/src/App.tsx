import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './stores/auth'
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

import Login from './pages/auth/Login'
import Register from './pages/auth/Register'

import Dashboard from './pages/portal/Dashboard'
import Orders from './pages/portal/Orders'
import Services from './pages/portal/Services'
import Invoices from './pages/portal/Invoices'
import BillingMethods from './pages/portal/BillingMethods'
import Security from './pages/portal/Security'

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

export default function App() {
  const { loadUser, token } = useAuthStore()

  useEffect(() => {
    if (token) loadUser()
  }, [token, loadUser])

  return (
    <Routes>
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
      </Route>

      {/* Portal (authenticated) */}
      <Route element={<ProtectedRoute><PortalLayout /></ProtectedRoute>}>
        <Route path="/portal/dashboard" element={<Dashboard />} />
        <Route path="/portal/orders" element={<Orders />} />
        <Route path="/portal/services" element={<Services />} />
        <Route path="/portal/invoices" element={<Invoices />} />
        <Route path="/portal/billing" element={<BillingMethods />} />
        <Route path="/portal/security" element={<Security />} />
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
  )
}
