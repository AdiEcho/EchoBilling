import { useFetch } from '../../hooks/useFetch'
import type { AdminDashboardStats } from '../../types/models'
import StatCard from '../../components/ui/StatCard'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { Users, ShoppingCart, DollarSign, Server } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function AdminDashboard() {
  const { t } = useTranslation()

  const { data: stats, loading } = useFetch<AdminDashboardStats>('/admin/dashboard')

  const statCards = [
    {
      title: t('admin.dashboard.totalCustomers'),
      value: stats?.total_customers ?? 0,
      icon: Users,
      iconColor: 'text-primary',
      iconBg: 'bg-primary/10',
    },
    {
      title: t('admin.dashboard.totalOrders'),
      value: stats?.total_orders ?? 0,
      icon: ShoppingCart,
      iconColor: 'text-cta',
      iconBg: 'bg-cta/10',
    },
    {
      title: t('admin.dashboard.revenue'),
      value: `${t('common.currency')}${stats?.revenue?.toFixed(2) ?? '0.00'}`,
      icon: DollarSign,
      iconColor: 'text-warning',
      iconBg: 'bg-warning/10',
    },
    {
      title: t('admin.dashboard.activeServices'),
      value: stats?.active_services ?? 0,
      icon: Server,
      iconColor: 'text-info',
      iconBg: 'bg-info/10',
    },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-text">{t('admin.dashboard.title')}</h1>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">{[1,2,3,4].map(i => <SkeletonCard key={i} />)}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>
      )}
    </div>
  )
}
