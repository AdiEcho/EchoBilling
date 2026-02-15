import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FileText,
  CreditCard,
  Users,
  Settings,
  FileEdit,
  Layers,
  ArrowLeft,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import SidebarLayout, { type SidebarLink } from './SidebarLayout'

export default function AdminLayout() {
  const { t } = useTranslation()

  const links: SidebarLink[] = [
    { to: '/admin/dashboard', label: t('common.dashboard'), icon: LayoutDashboard },
    { to: '/admin/products', label: t('common.products', { defaultValue: 'Products' }), icon: Package },
    { to: '/admin/templates', label: t('common.templates', { defaultValue: 'Templates' }), icon: Layers },
    { to: '/admin/content', label: t('common.contentManagement', { defaultValue: 'Content' }), icon: FileEdit },
    { to: '/admin/orders', label: t('common.orders'), icon: ShoppingCart },
    { to: '/admin/invoices', label: t('common.invoices'), icon: FileText },
    { to: '/admin/payments', label: t('common.payments'), icon: CreditCard },
    { to: '/admin/customers', label: t('common.customers'), icon: Users },
    { to: '/admin/system', label: t('common.system'), icon: Settings },
    { to: '/portal/dashboard', label: t('common.backToPortal'), icon: ArrowLeft },
  ]

  return (
    <SidebarLayout
      links={links}
      brandLabel={t('adminLayout.admin')}
      brandTo="/admin/dashboard"
      roleLabel={t('adminLayout.admin')}
    />
  )
}
