import { useEffect, useState } from 'react'
import { useAuthStore } from '../../stores/auth'
import { api } from '../../lib/utils'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { SkeletonCard, SkeletonTable } from '../../components/ui/Skeleton'
import { Server, ShoppingCart, FileText, DollarSign } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toDateLocale } from '../../i18n/locale'

interface Stats {
  active_services: number
  pending_orders: number
  unpaid_invoices: number
  total_spent: number
}

interface Order {
  id: string
  status: string
  total: number
  created_at: string
}

export default function Dashboard() {
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const { t, i18n } = useTranslation()
  const locale = toDateLocale(i18n.language)

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return

      try {
        const [statsData, ordersData] = await Promise.all([
          api<Stats>('/portal/stats', { token }),
          api<{ orders: Order[] }>('/portal/orders?limit=5', { token }),
        ])
        setStats(statsData)
        setRecentOrders(ordersData.orders)
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }

    void fetchData()
  }, [token])

  if (loading) {
    return (
      <div className="space-y-6">
        <div><div className="h-9 w-64 animate-pulse bg-surface-hover/50 rounded" /><div className="h-5 w-48 animate-pulse bg-surface-hover/50 rounded mt-2" /></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">{[1,2,3,4].map(i => <SkeletonCard key={i} />)}</div>
        <Card><SkeletonTable rows={5} cols={4} /></Card>
      </div>
    )
  }

  const statusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'success'
      case 'pending_payment':
        return 'warning'
      case 'paid':
        return 'info'
      case 'cancelled':
        return 'danger'
      default:
        return 'default'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text">
          {t('portal.dashboard.welcome', { name: user?.name ?? user?.email ?? '' })}
        </h1>
        <p className="text-text-secondary mt-2">{t('portal.dashboard.overview')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">{t('portal.dashboard.activeServices')}</p>
              <p className="text-2xl font-bold text-text mt-1">{stats?.active_services || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-cta/10 flex items-center justify-center">
              <Server className="w-6 h-6 text-cta" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">{t('portal.dashboard.pendingOrders')}</p>
              <p className="text-2xl font-bold text-text mt-1">{stats?.pending_orders || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-warning" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">{t('portal.dashboard.unpaidInvoices')}</p>
              <p className="text-2xl font-bold text-text mt-1">{stats?.unpaid_invoices || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-danger" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">{t('portal.dashboard.totalSpent')}</p>
              <p className="text-2xl font-bold text-text mt-1">
                {t('common.currency')}
                {stats?.total_spent || 0}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="text-xl font-semibold text-text mb-4">{t('portal.dashboard.recentOrders')}</h2>
        {recentOrders.length === 0 ? (
          <p className="text-text-secondary text-center py-8">{t('portal.dashboard.noOrders')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                    {t('portal.dashboard.orderId')}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                    {t('common.status')}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                    {t('common.amount')}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                    {t('common.date')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-border/50 last:border-0">
                    <td className="py-3 px-4 text-sm text-text font-mono">{order.id.substring(0, 8)}...</td>
                    <td className="py-3 px-4">
                      <Badge variant={statusVariant(order.status)}>
                        {t(`status.${order.status}`, { defaultValue: order.status })}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-text">
                      {t('common.currency')}
                      {order.total}
                    </td>
                    <td className="py-3 px-4 text-sm text-text-secondary">
                      {new Date(order.created_at).toLocaleDateString(locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
