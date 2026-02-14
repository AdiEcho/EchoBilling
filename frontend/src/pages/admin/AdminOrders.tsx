import { useEffect, useState, useMemo } from 'react'
import { Filter, Eye } from 'lucide-react'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import DataTable from '../../components/ui/DataTable'
import { useAuthStore } from '../../stores/auth'
import { api } from '../../lib/utils'
import { useTranslation } from 'react-i18next'
import { toDateLocale } from '../../i18n/locale'
import type { ColumnDef } from '@tanstack/react-table'

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

  const columns = useMemo<ColumnDef<Order, unknown>[]>(
    () => [
      {
        accessorKey: 'id',
        header: () => t('admin.orders.orderId'),
        cell: ({ row }) => <span className="text-text font-mono">{row.original.id.slice(0, 8)}</span>,
      },
      {
        accessorKey: 'customer_name',
        header: () => t('admin.orders.customer'),
        cell: ({ row }) => (
          <div>
            <div className="text-text">{row.original.customer_name}</div>
            <div className="text-text-secondary text-xs">{row.original.customer_email}</div>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: () => t('common.status'),
        cell: ({ row }) => (
          <select
            value={row.original.status}
            disabled={updatingStatus === row.original.id}
            onChange={(e) => void handleStatusUpdate(row.original.id, e.target.value)}
            className="bg-surface border border-border rounded px-2 py-1 text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{t(`status.${s}`, { defaultValue: s })}</option>
            ))}
          </select>
        ),
      },
      {
        accessorKey: 'amount',
        header: () => t('common.amount'),
        cell: ({ row }) => (
          <span className="text-text">{t('common.currency')}{row.original.amount.toFixed(2)}</span>
        ),
      },
      {
        accessorKey: 'created_at',
        header: () => t('common.date'),
        cell: ({ row }) => (
          <span className="text-text-secondary">
            {new Date(row.original.created_at).toLocaleDateString(locale)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => t('common.actions'),
        cell: ({ row }) => (
          <Button variant="ghost" size="sm" onClick={() => setViewOrder(row.original)}>
            <Eye className="w-4 h-4 mr-1" />
            {t('admin.orders.view')}
          </Button>
        ),
      },
    ],
    [t, locale, updatingStatus]
  )

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
        <DataTable
          columns={columns}
          data={filteredOrders}
          loading={loading}
          emptyText={t('admin.orders.noOrders')}
          skeletonCols={6}
        />
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
