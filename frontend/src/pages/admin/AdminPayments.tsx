import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import { SkeletonTable } from '../../components/ui/Skeleton'
import { useAuthStore } from '../../stores/auth'
import { api } from '../../lib/utils'
import { useTranslation } from 'react-i18next'
import { toDateLocale } from '../../i18n/locale'

interface Payment {
  id: string
  amount: number
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  method: string
  created_at: string
}

export default function AdminPayments() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [refundPayment, setRefundPayment] = useState<Payment | null>(null)
  const [refundAmount, setRefundAmount] = useState('')
  const [refunding, setRefunding] = useState(false)
  const token = useAuthStore((state) => state.token)
  const { t, i18n } = useTranslation()
  const locale = toDateLocale(i18n.language)

  const fetchPayments = async () => {
    if (!token) return
    try {
      const data = await api<Payment[]>('/admin/payments', { token })
      setPayments(data)
    } catch (error) {
      console.error('Failed to fetch payments:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchPayments()
  }, [token])

  const handleRefund = async () => {
    if (!token || !refundPayment) return
    setRefunding(true)
    try {
      await api('/admin/refunds', {
        method: 'POST',
        token,
        body: JSON.stringify({
          payment_id: refundPayment.id,
          amount: parseFloat(refundAmount),
        }),
      })
      setRefundPayment(null)
      setRefundAmount('')
      setLoading(true)
      void fetchPayments()
    } catch (error) {
      console.error('Failed to create refund:', error)
    } finally {
      setRefunding(false)
    }
  }

  const openRefundModal = (payment: Payment) => {
    setRefundPayment(payment)
    setRefundAmount(payment.amount.toFixed(2))
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'success'
      case 'pending': return 'warning'
      case 'failed': return 'danger'
      case 'refunded': return 'default'
      default: return 'default'
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-text">{t('admin.payments.title')}</h1>

      <Card>
        {loading ? (
          <SkeletonTable rows={5} cols={6} />
        ) : payments.length === 0 ? (
          <div className="text-text-secondary p-4">{t('admin.payments.noPayments')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">{t('admin.payments.paymentId')}</th>
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">{t('common.amount')}</th>
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">{t('common.status')}</th>
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">{t('admin.payments.method')}</th>
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">{t('common.date')}</th>
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-border hover:bg-surface/50 transition-colors">
                    <td className="py-3 px-4 text-text font-mono">{payment.id.slice(0, 8)}</td>
                    <td className="py-3 px-4 text-text">{t('common.currency')}{payment.amount.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <Badge variant={getStatusVariant(payment.status)}>
                        {t(`status.${payment.status}`, { defaultValue: payment.status })}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-text-secondary capitalize">{payment.method}</td>
                    <td className="py-3 px-4 text-text-secondary">{new Date(payment.created_at).toLocaleDateString(locale)}</td>
                    <td className="py-3 px-4">
                      {payment.status === 'completed' && (
                        <Button size="sm" variant="outline" onClick={() => openRefundModal(payment)}>
                          <RefreshCw className="w-3 h-3 mr-1" />
                          {t('admin.payments.refund')}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Refund Modal */}
      <Modal
        open={!!refundPayment}
        onClose={() => setRefundPayment(null)}
        title={t('admin.payments.refundTitle')}
      >
        {refundPayment && (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              {t('admin.payments.refundConfirm', { id: refundPayment.id.slice(0, 8) })}
            </p>
            <div className="text-sm">
              <span className="text-text-secondary">{t('admin.payments.originalAmount')}: </span>
              <span className="text-text font-bold">{t('common.currency')}{refundPayment.amount.toFixed(2)}</span>
            </div>
            <Input
              label={t('admin.payments.refundAmount')}
              type="number"
              step="0.01"
              max={refundPayment.amount}
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              required
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setRefundPayment(null)}>
                {t('common.cancel')}
              </Button>
              <Button variant="danger" onClick={() => void handleRefund()} disabled={refunding || !refundAmount}>
                {refunding ? t('admin.payments.refunding') : t('admin.payments.confirmRefund')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
