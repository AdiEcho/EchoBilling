import { useEffect, useState } from 'react'
import { Filter } from 'lucide-react'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { useAuthStore } from '../../stores/auth'
import { api } from '../../lib/utils'
import { useTranslation } from 'react-i18next'
import { toDateLocale } from '../../i18n/locale'

interface Order {
  id: string
  customer_name: string
  customer_email: string
  status: 'pending' | 'processing' | 'completed' | 'cancelled'
  amount: number
  created_at: string
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const token = useAuthStore((state) => state.token)
  const { t, i18n } = useTranslation()
  const locale = toDateLocale(i18n.language)

  useEffect(() => {
    const fetchOrders = async () => {
      if (!token) return
      try {
        const data = await api<Order[]>('/admin/orders', { token })
        setOrders(data)
      } catch (error) {
        console.error('Failed to fetch orders:', error)
      } finally {
        setLoading(false)
      }
    }
    void fetchOrders()
  }, [token])

  const filteredOrders =
    statusFilter === 'all' ? orders : orders.filter((o) => o.status === statusFilter)

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success'
      case 'processing':
        return 'warning'
      case 'cancelled':
        return 'danger'
      default:
        return 'default'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-text">{t('admin.orders.title')}</h1>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-text-secondary" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-surface border border-border rounded-lg px-3 py-2 text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">{t('admin.orders.filters.all')}</option>
            <option value="pending">{t('admin.orders.filters.pending')}</option>
            <option value="processing">{t('admin.orders.filters.processing')}</option>
            <option value="completed">{t('admin.orders.filters.completed')}</option>
            <option value="cancelled">{t('admin.orders.filters.cancelled')}</option>
          </select>
        </div>
      </div>

      <Card>
        {loading ? (
          <div className="text-text-secondary p-4">{t('common.loading')}</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-text-secondary p-4">{t('admin.orders.noOrders')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">
                    {t('admin.orders.orderId')}
                  </th>
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">
                    {t('admin.orders.customer')}
                  </th>
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">{t('common.status')}</th>
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">{t('common.amount')}</th>
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">{t('common.date')}</th>
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-border hover:bg-surface/50 transition-colors"
                  >
                    <td className="py-3 px-4 text-text font-mono">{order.id.slice(0, 8)}</td>
                    <td className="py-3 px-4">
                      <div>
                        <div className="text-text">{order.customer_name}</div>
                        <div className="text-text-secondary text-xs">{order.customer_email}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={getStatusVariant(order.status)}>
                        {t(`status.${order.status}`, { defaultValue: order.status })}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-text">
                      {t('common.currency')}
                      {order.amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-text-secondary">
                      {new Date(order.created_at).toLocaleDateString(locale)}
                    </td>
                    <td className="py-3 px-4">
                      <button className="text-primary hover:text-primary/80 text-sm">{t('admin.orders.view')}</button>
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
