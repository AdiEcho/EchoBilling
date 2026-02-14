import { useEffect, useState } from 'react'
import { Users, ShoppingCart, DollarSign, Server } from 'lucide-react'
import Card from '../../components/ui/Card'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { useAuthStore } from '../../stores/auth'
import { api } from '../../lib/utils'
import { useTranslation } from 'react-i18next'

interface DashboardStats {
  total_customers: number
  total_orders: number
  revenue: number
  active_services: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const token = useAuthStore((state) => state.token)
  const { t } = useTranslation()

  useEffect(() => {
    const fetchStats = async () => {
      if (!token) return
      try {
        const data = await api<DashboardStats>('/admin/dashboard', { token })
        setStats(data)
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }
    void fetchStats()
  }, [token])

  const statCards = [
    {
      title: t('admin.dashboard.totalCustomers'),
      value: stats?.total_customers ?? 0,
      icon: Users,
      color: 'text-primary',
    },
    {
      title: t('admin.dashboard.totalOrders'),
      value: stats?.total_orders ?? 0,
      icon: ShoppingCart,
      color: 'text-cta',
    },
    {
      title: t('admin.dashboard.revenue'),
      value: `${t('common.currency')}${stats?.revenue?.toFixed(2) ?? '0.00'}`,
      icon: DollarSign,
      color: 'text-yellow-500',
    },
    {
      title: t('admin.dashboard.activeServices'),
      value: stats?.active_services ?? 0,
      icon: Server,
      color: 'text-blue-500',
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
            <Card key={stat.title}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm">{stat.title}</p>
                  <p className="text-2xl font-bold text-text mt-1">{stat.value}</p>
                </div>
                <stat.icon className={`w-10 h-10 ${stat.color}`} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
