import {
  LayoutDashboard,
  ShoppingCart,
  Server,
  FileText,
  CreditCard,
  Shield,
  Settings,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../stores/auth'
import SidebarLayout, { type SidebarLink } from './SidebarLayout'

export default function PortalLayout() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)

  const links: SidebarLink[] = [
    { to: '/portal/dashboard', label: t('common.dashboard'), icon: LayoutDashboard },
    { to: '/portal/orders', label: t('common.orders'), icon: ShoppingCart },
    { to: '/portal/services', label: t('common.services'), icon: Server },
    { to: '/portal/invoices', label: t('common.invoices'), icon: FileText },
    { to: '/portal/billing', label: t('common.billingMethods'), icon: CreditCard },
    { to: '/portal/security', label: t('common.security'), icon: Shield },
  ]

  if (user?.role === 'admin') {
    links.push({ to: '/admin/dashboard', label: t('common.adminPanel'), icon: Settings })
  }

  return (
    <SidebarLayout
      links={links}
      brandLabel="Billing"
      brandTo="/"
      showUserEmail
    />
  )
}
