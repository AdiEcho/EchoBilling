import { useEffect, useState } from 'react'
import { useAuthStore } from '../../stores/auth'
import { api } from '../../lib/utils'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { SkeletonTable } from '../../components/ui/Skeleton'
import { Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toDateLocale } from '../../i18n/locale'

interface Order {
  id: string
  status: string
  total: number
  created_at: string
}

export default function Orders() {
  const token = useAuthStore((state) => state.token)
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const limit = 10
  const { t, i18n } = useTranslation()
  const locale = toDateLocale(i18n.language)

  useEffect(() => {
    const fetchOrders = async () => {
      if (!token) return

      setLoading(true)
      try {
        const data = await api<{ orders: Order[]; total: number }>(
          `/portal/orders?page=${page}&limit=${limit}`,
          { token }
        )
        setOrders(data.orders)
        setTotalPages(Math.ceil(data.total / limit))
      } catch (err) {
        console.error('Failed to fetch orders:', err)
      } finally {
        setLoading(false)
      }
    }

    void fetchOrders()
  }, [token, page])

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

  if (loading) {
    return (
      <div className="space-y-6">
        <div><div className="h-9 w-48 animate-pulse bg-surface-hover/50 rounded" /><div className="h-5 w-64 animate-pulse bg-surface-hover/50 rounded mt-2" /></div>
        <Card><SkeletonTable rows={5} cols={5} /></Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text">{t('portal.orders.title')}</h1>
        <p className="text-text-secondary mt-2">{t('portal.orders.subtitle')}</p>
      </div>

      <Card>
        {orders.length === 0 ? (
          <p className="text-text-secondary text-center py-8">{t('portal.orders.noOrders')}</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                      {t('portal.orders.orderId')}
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
                    <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                      {t('common.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
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
                      <td className="py-3 px-4">
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/portal/orders/${order.id}`)}>
                          <Eye className="w-4 h-4 mr-1" />
                          {t('portal.orders.view')}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <p className="text-sm text-text-secondary">{t('common.pageInfo', { page, total: totalPages })}</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}
