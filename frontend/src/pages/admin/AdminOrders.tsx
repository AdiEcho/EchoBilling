import { useEffect, useState } from 'react'
import { Filter, Eye } from 'lucide-react'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { SkeletonTable } from '../../components/ui/Skeleton'
import { useAuthStore } from '../../stores/auth'
import { api } from '../../lib/utils'
import { useTranslation } from 'react-i18next'
import { toDateLocale } from '../../i18n/locale'

interface OrderItem {
  id: string
  plan_name: string
  quantity: number
  unit_price: number
}

interface Order {
  id: string
  customer_name: string
  customer_email: string
  status: 'pending' | 'processing' | 'completed' | 'cancelled'
  amount: number
  items?: OrderItem[]
  created_at: string
}

const STATUS_OPTIONS = ['pending', 'processing', 'completed', 'cancelled']

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [viewOrder, setViewOrder] = useState<Order | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const token = useAuthStore((state) => state.token)
  const { t, i18n } = useTranslation()
  const locale = toDateLocale(i18n.language)

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

  useEffect(() => {
    void fetchOrders()
  }, [token])

  const filteredOrders =
    statusFilter === 'all' ? orders : orders.filter((o) => o.status === statusFilter)

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'success'
      case 'processing': return 'warning'
      case 'cancelled': return 'danger'
      default: return 'default'
    }
  }

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    if (!token) return
    setUpdatingStatus(orderId)
    try {
      await api(`/admin/orders/${orderId}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ status: newStatus }),
      })
      setOrders((prev) =>
        prev.map((o) => o.id === orderId ? { ...o, status: newStatus as Order['status'] } : o)
      )
    } catch (error) {
      console.error('Failed to update order status:', error)
    } finally {
      setUpdatingStatus(null)
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
          <SkeletonTable rows={5} cols={6} />
        ) : filteredOrders.length === 0 ? (
          <div className="text-text-secondary p-4">{t('admin.orders.noOrders')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">{t('admin.orders.orderId')}</th>
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">{t('admin.orders.customer')}</th>
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">{t('common.status')}</th>
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">{t('common.amount')}</th>
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">{t('common.date')}</th>
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b border-border hover:bg-surface/50 transition-colors">
                    <td className="py-3 px-4 text-text font-mono">{order.id.slice(0, 8)}</td>
                    <td className="py-3 px-4">
                      <div>
                        <div className="text-text">{order.customer_name}</div>
                        <div className="text-text-secondary text-xs">{order.customer_email}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={order.status}
                        disabled={updatingStatus === order.id}
                        onChange={(e) => void handleStatusUpdate(order.id, e.target.value)}
                        className="bg-surface border border-border rounded px-2 py-1 text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{t(`status.${s}`, { defaultValue: s })}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4 text-text">{t('common.currency')}{order.amount.toFixed(2)}</td>
                    <td className="py-3 px-4 text-text-secondary">{new Date(order.created_at).toLocaleDateString(locale)}</td>
                    <td className="py-3 px-4">
                      <Button variant="ghost" size="sm" onClick={() => setViewOrder(order)}>
                        <Eye className="w-4 h-4 mr-1" />
                        {t('admin.orders.view')}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Order Detail Modal */}
      <Modal open={!!viewOrder} onClose={() => setViewOrder(null)} title={`${t('admin.orders.orderId')}: ${viewOrder?.id.slice(0, 8) ?? ''}`}>
        {viewOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-text-secondary">{t('admin.orders.customer')}</p>
                <p className="text-text">{viewOrder.customer_name}</p>
                <p className="text-text-secondary text-xs">{viewOrder.customer_email}</p>
              </div>
              <div>
                <p className="text-text-secondary">{t('common.status')}</p>
                <Badge variant={getStatusVariant(viewOrder.status)}>
                  {t(`status.${viewOrder.status}`, { defaultValue: viewOrder.status })}
                </Badge>
              </div>
              <div>
                <p className="text-text-secondary">{t('common.amount')}</p>
                <p className="text-text font-bold">{t('common.currency')}{viewOrder.amount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-text-secondary">{t('common.date')}</p>
                <p className="text-text">{new Date(viewOrder.created_at).toLocaleDateString(locale)}</p>
              </div>
            </div>
            {viewOrder.items && viewOrder.items.length > 0 && (
              <div>
                <p className="text-sm font-medium text-text mb-2">{t('admin.orders.orderItems')}</p>
                <div className="space-y-1">
                  {viewOrder.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-text">{item.plan_name} x{item.quantity}</span>
                      <span className="text-text-secondary">{t('common.currency')}{item.unit_price}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
