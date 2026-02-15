import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/auth'
import Button from '../components/ui/Button'
import LanguageSwitcher from '../components/LanguageSwitcher'
import ThemeToggle from '../components/ThemeToggle'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useBrandingStore } from '../stores/branding'

export default function PublicLayout() {
  const { user } = useAuthStore()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { t } = useTranslation()
  const siteName = useBrandingStore((s) => s.siteName)
  const companyLegalName = useBrandingStore((s) => s.companyLegalName)

  const navLinks = [
    { to: '/', label: t('nav.home') },
    { to: '/pricing', label: t('nav.pricing') },
    { to: '/about', label: t('nav.about') },
    { to: '/contact', label: t('nav.contact') },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b border-border bg-bg/80 backdrop-blur-md">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-xl font-bold font-heading text-text">
            {siteName}
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm transition-colors ${
                  location.pathname === link.to
                    ? 'text-primary'
                    : 'text-text-secondary hover:text-text'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <LanguageSwitcher />
            {user ? (
              <Link to="/portal/dashboard">
                <Button size="sm">{t('common.dashboard')}</Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">{t('common.signIn')}</Button>
                </Link>
                <Link to="/register">
                  <Button variant="cta" size="sm">{t('common.getStarted')}</Button>
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden text-text-secondary"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={t('publicLayout.toggleMenu')}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>

        {mobileOpen && (
          <div className="md:hidden border-t border-border bg-bg px-6 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="block text-sm text-text-secondary hover:text-text"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-border flex gap-3 items-center">
              <ThemeToggle />
              <LanguageSwitcher />
              {user ? (
                <Link to="/portal/dashboard" onClick={() => setMobileOpen(false)}>
                  <Button size="sm">{t('common.dashboard')}</Button>
                </Link>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileOpen(false)}>
                    <Button variant="ghost" size="sm">{t('common.signIn')}</Button>
                  </Link>
                  <Link to="/register" onClick={() => setMobileOpen(false)}>
                    <Button variant="cta" size="sm">{t('common.getStarted')}</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-border bg-surface/50">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-text mb-3">{t('footer.product')}</h3>
              <div className="space-y-2">
                <Link to="/pricing" className="block text-sm text-text-muted hover:text-text-secondary">
                  {t('footer.pricing')}
                </Link>
                <Link to="/vps/standard" className="block text-sm text-text-muted hover:text-text-secondary">
                  {t('footer.vpsHosting')}
                </Link>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text mb-3">{t('footer.company')}</h3>
              <div className="space-y-2">
                <Link to="/about" className="block text-sm text-text-muted hover:text-text-secondary">
                  {t('footer.about')}
                </Link>
                <Link to="/contact" className="block text-sm text-text-muted hover:text-text-secondary">
                  {t('footer.contact')}
                </Link>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text mb-3">{t('footer.legal')}</h3>
              <div className="space-y-2">
                <Link to="/terms" className="block text-sm text-text-muted hover:text-text-secondary">
                  {t('footer.terms')}
                </Link>
                <Link to="/privacy" className="block text-sm text-text-muted hover:text-text-secondary">
                  {t('footer.privacy')}
                </Link>
                <Link to="/refund-policy" className="block text-sm text-text-muted hover:text-text-secondary">
                  {t('footer.refund')}
                </Link>
                <Link to="/cancellation-policy" className="block text-sm text-text-muted hover:text-text-secondary">
                  {t('footer.cancellation')}
                </Link>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text mb-3">{t('footer.support')}</h3>
              <div className="space-y-2">
                <Link to="/contact" className="block text-sm text-text-muted hover:text-text-secondary">
                  {t('footer.helpCenter')}
                </Link>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border text-center text-sm text-text-muted">
            {t('footer.copyright', { year: new Date().getFullYear(), companyLegal: companyLegalName })}
          </div>
        </div>
      </footer>
    </div>
  )
}
