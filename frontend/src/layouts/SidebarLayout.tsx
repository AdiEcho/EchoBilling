import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/auth'
import { LogOut, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react'
import { useState } from 'react'
import LanguageSwitcher from '../components/LanguageSwitcher'
import ThemeToggle from '../components/ThemeToggle'
import { useTranslation } from 'react-i18next'
import { useBrandingStore } from '../stores/branding'
import type { LucideIcon } from 'lucide-react'

export interface SidebarLink {
  to: string
  label: string
  icon: LucideIcon
}

interface SidebarLayoutProps {
  links: SidebarLink[]
  brandLabel: string
  brandTo: string
  showUserEmail?: boolean
  roleLabel?: string
}

export default function SidebarLayout({
  links,
  brandLabel,
  brandTo,
  showUserEmail = true,
  roleLabel,
}: SidebarLayoutProps) {
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { t } = useTranslation()
  const siteName = useBrandingStore((s) => s.siteName)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const sidebarContent = (
    <>
      <nav className="flex-1 p-2 space-y-1">
        {links.map((link) => {
          const Icon = link.icon
          const active = link.to === '/' ? location.pathname === '/' : location.pathname.startsWith(link.to)
          return (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              title={collapsed ? link.label : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors relative group ${
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text'
              }`}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span>{link.label}</span>}
              {collapsed && (
                <span className="absolute left-full ml-2 px-2 py-1 rounded-md bg-surface border border-border text-text text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                  {link.label}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="p-2 border-t border-border">
        {!collapsed && <ThemeToggle className="mb-2 w-full justify-start" />}
        {!collapsed && <LanguageSwitcher className="mb-2 w-full justify-start" />}
        {!collapsed && user && (
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-medium text-text truncate">
              {user.name || user.email}
            </p>
            <p className="text-xs text-text-muted truncate">
              {roleLabel ?? (showUserEmail ? user.email : '')}
            </p>
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
    </>
  )

  return (
    <div className="min-h-screen flex bg-bg">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 h-screen border-r border-border bg-surface/50
          flex flex-col z-50 transition-all duration-200
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${collapsed ? 'w-16' : 'w-60'}
        `}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          {!collapsed && (
            <Link to={brandTo} className="text-lg font-bold font-heading text-text">
              {siteName}
            </Link>
          )}
          <button
            onClick={() => {
              if (mobileOpen) setMobileOpen(false)
              else setCollapsed(!collapsed)
            }}
            className="text-text-muted hover:text-text p-1 hidden lg:block"
            aria-label={t('portalLayout.toggleSidebar')}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          <button
            onClick={() => setMobileOpen(false)}
            className="text-text-muted hover:text-text p-1 lg:hidden"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>
        {sidebarContent}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex items-center gap-3 p-4 border-b border-border bg-bg/80 backdrop-blur-md lg:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-text-secondary hover:text-text"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <span className="text-lg font-bold font-heading text-text">
            {siteName}
          </span>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
