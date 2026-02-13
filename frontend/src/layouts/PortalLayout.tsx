import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/auth'
import {
  LayoutDashboard,
  ShoppingCart,
  Server,
  FileText,
  CreditCard,
  Shield,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useState } from 'react'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { useTranslation } from 'react-i18next'

export default function PortalLayout() {
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const { t } = useTranslation()

  const sidebarLinks = [
    { to: '/portal/dashboard', label: t('common.dashboard'), icon: LayoutDashboard },
    { to: '/portal/orders', label: t('common.orders'), icon: ShoppingCart },
    { to: '/portal/services', label: t('common.services'), icon: Server },
    { to: '/portal/invoices', label: t('common.invoices'), icon: FileText },
    { to: '/portal/billing', label: t('common.billingMethods'), icon: CreditCard },
    { to: '/portal/security', label: t('common.security'), icon: Shield },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex bg-bg">
      <aside
        className={`sticky top-0 h-screen border-r border-border bg-surface/50 flex flex-col transition-all duration-200 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          {!collapsed && (
            <Link to="/" className="text-lg font-bold font-heading text-text">
              Echo<span className="text-primary">Billing</span>
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-text-muted hover:text-text p-1"
            aria-label={t('portalLayout.toggleSidebar')}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
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
                {!collapsed && <span>{link.label}</span>}
              </Link>
            )
          })}
        </nav>

        <div className="p-2 border-t border-border">
          {!collapsed && <LanguageSwitcher className="mb-2 w-full justify-start" />}
          {!collapsed && user && (
            <div className="px-3 py-2 mb-2">
              <p className="text-sm font-medium text-text truncate">{user.name || user.email}</p>
              <p className="text-xs text-text-muted truncate">{user.email}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm text-text-secondary hover:bg-surface-hover hover:text-danger transition-colors"
          >
            <LogOut size={18} />
            {!collapsed && <span>{t('common.signOut')}</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
