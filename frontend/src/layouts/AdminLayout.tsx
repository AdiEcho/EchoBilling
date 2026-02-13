import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/auth'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FileText,
  CreditCard,
  Users,
  Settings,
  LogOut,
} from 'lucide-react'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { useTranslation } from 'react-i18next'

export default function AdminLayout() {
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const sidebarLinks = [
    { to: '/admin/dashboard', label: t('common.dashboard'), icon: LayoutDashboard },
    { to: '/admin/products', label: t('common.products', { defaultValue: 'Products' }), icon: Package },
    { to: '/admin/orders', label: t('common.orders'), icon: ShoppingCart },
    { to: '/admin/invoices', label: t('common.invoices'), icon: FileText },
    { to: '/admin/payments', label: t('common.payments'), icon: CreditCard },
    { to: '/admin/customers', label: t('common.customers'), icon: Users },
    { to: '/admin/system', label: t('common.system'), icon: Settings },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex bg-bg">
      <aside className="sticky top-0 h-screen w-60 border-r border-border bg-surface/50 flex flex-col">
        <div className="p-4 border-b border-border">
          <Link to="/admin/dashboard" className="text-lg font-bold font-heading text-text">
            Echo<span className="text-primary">{t('adminLayout.admin')}</span>
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
          <LanguageSwitcher className="mb-2 w-full justify-start" />
          {user && (
            <div className="px-3 py-2 mb-2">
              <p className="text-sm font-medium text-text truncate">{user.name || user.email}</p>
              <p className="text-xs text-text-muted">{t('adminLayout.admin')}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm text-text-secondary hover:bg-surface-hover hover:text-danger transition-colors"
          >
            <LogOut size={18} />
            <span>{t('common.signOut')}</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
