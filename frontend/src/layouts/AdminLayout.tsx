import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/auth'
import {
  LayoutDashboard, Package, ShoppingCart, FileText,
  CreditCard, Users, Settings, LogOut,
} from 'lucide-react'

const sidebarLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/admin/invoices', label: 'Invoices', icon: FileText },
  { to: '/admin/payments', label: 'Payments', icon: CreditCard },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/system', label: 'System', icon: Settings },
]

export default function AdminLayout() {
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex bg-bg">
      <aside className="sticky top-0 h-screen w-60 border-r border-border bg-surface/50 flex flex-col">
        <div className="p-4 border-b border-border">
          <Link to="/admin/dashboard" className="text-lg font-bold font-heading text-text">
            Echo<span className="text-primary">Admin</span>
          </Link>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {sidebarLinks.map((link) => {
            const Icon = link.icon
            const active = location.pathname.startsWith(link.to)
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-secondary hover:bg-surface-hover hover:text-text'
                }`}
              >
                <Icon size={18} />
                <span>{link.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-2 border-t border-border">
          {user && (
            <div className="px-3 py-2 mb-2">
              <p className="text-sm font-medium text-text truncate">{user.name || user.email}</p>
              <p className="text-xs text-text-muted">Admin</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm text-text-secondary hover:bg-surface-hover hover:text-danger transition-colors"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
