import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CreditCard } from 'lucide-react'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { SkeletonCard, SkeletonTable } from '../../components/ui/Skeleton'
import { useAuthStore } from '../../stores/auth'
import { api } from '../../lib/utils'
import { useTranslation } from 'react-i18next'
import { toDateLocale } from '../../i18n/locale'

interface OrderItem {
  id: string
  plan_name: string
  quantity: number
  unit_price: number
  billing_cycle: string
}

interface Order {
  id: string
  status: string
  total_amount: number
  currency: string
  items: OrderItem[]
  created_at: string
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const token = useAuthStore((state) => state.token)
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [checkingOut, setCheckingOut] = useState(false)
  const { t, i18n } = useTranslation()
  const locale = toDateLocale(i18n.language)

  useEffect(() => {
    const fetchOrder = async () => {
      if (!token || !id) return
      try {
        const data = await api<Order>(`/portal/orders/${id}`, { token })
        setOrder(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : t('portal.orderDetail.failed'))
      } finally {
        setLoading(false)
      }
    }
    void fetchOrder()
  }, [token, id, t])

  const statusVariant = (status: string) => {
    switch (status) {
      case 'active': case 'completed': return 'success'
      case 'pending_payment': case 'pending': return 'warning'
      case 'paid': case 'processing': return 'info'
      case 'cancelled': return 'danger'
      default: return 'default'
    }
  }

  const handleCheckout = async () => {
    if (!token || !order) return
    setCheckingOut(true)
    try {
      const data = await api<{ session_url: string }>('/checkout/session', {
        method: 'POST',
        token,
        body: JSON.stringify({ order_id: order.id }),
      })
      window.location.href = data.session_url
    } catch (err) {
      console.error('Checkout failed:', err)
      setCheckingOut(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonCard />
        <SkeletonTable rows={3} cols={4} />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="space-y-6">
        <Card className="text-center py-12">
          <p className="text-text-secondary mb-4">{error || t('portal.orderDetail.notFound')}</p>
          <Button variant="outline" onClick={() => navigate('/portal/orders')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('common.goBack')}
          </Button>
        </Card>
      </div>
    )
  }

  const canPay = order.status === 'draft' || order.status === 'pending_payment'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/portal/orders')}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          {t('common.goBack')}
        </Button>
        <h1 className="text-3xl font-bold text-text">{t('portal.orderDetail.title')}</h1>
      </div>

      {/* Order Summary */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-text-secondary">{t('portal.orders.orderId')}</p>
            <p className="text-text font-mono">{order.id}</p>
          </div>
          <Badge variant={statusVariant(order.status) as 'success' | 'warning' | 'info' | 'danger' | 'default'}>
            {t(`status.${order.status}`, { defaultValue: order.status })}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-text-secondary">{t('common.date')}</p>
            <p className="text-text">{new Date(order.created_at).toLocaleDateString(locale)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-text-secondary">{t('common.amount')}</p>
            <p className="text-2xl font-bold text-text">
              {t('common.currency')}{order.total_amount}
            </p>
          </div>
        </div>
      </Card>

      {/* Order Items */}
      <Card>
        <h2 className="text-lg font-semibold text-text mb-4">{t('portal.orderDetail.items')}</h2>
        {order.items && order.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">{t('portal.orderDetail.planName')}</th>
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">{t('portal.orderDetail.billingCycle')}</th>
                  <th className="text-right py-3 px-4 text-text-secondary font-medium">{t('portal.orderDetail.quantity')}</th>
                  <th className="text-right py-3 px-4 text-text-secondary font-medium">{t('portal.orderDetail.unitPrice')}</th>
                  <th className="text-right py-3 px-4 text-text-secondary font-medium">{t('portal.orderDetail.subtotal')}</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-b border-border/50 last:border-0">
                    <td className="py-3 px-4 text-text">{item.plan_name}</td>
                    <td className="py-3 px-4 text-text-secondary">{t(`portal.orderDetail.cycle_${item.billing_cycle}`, { defaultValue: item.billing_cycle })}</td>
                    <td className="py-3 px-4 text-text text-right">{item.quantity}</td>
                    <td className="py-3 px-4 text-text text-right">{t('common.currency')}{item.unit_price}</td>
                    <td className="py-3 px-4 text-text font-medium text-right">
                      {t('common.currency')}{(item.quantity * item.unit_price).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-text-secondary">{t('portal.orderDetail.noItems')}</p>
        )}

        {/* Total */}
        <div className="border-t border-border mt-4 pt-4 flex justify-end">
          <div className="text-right">
            <span className="text-text-secondary mr-4">{t('portal.orderDetail.total')}</span>
            <span className="text-xl font-bold text-text">{t('common.currency')}{order.total_amount}</span>
          </div>
        </div>
      </Card>

      {/* Pay Button */}
      {canPay && (
        <div className="flex justify-end">
          <Button variant="cta" size="lg" onClick={() => void handleCheckout()} disabled={checkingOut}>
            <CreditCard className="w-5 h-5 mr-2" />
            {checkingOut ? t('portal.orderDetail.processing') : t('portal.orderDetail.payNow')}
          </Button>
        </div>
      )}
    </div>
  )
}
