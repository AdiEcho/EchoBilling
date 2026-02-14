import { useEffect, useState, useMemo } from 'react'
import { RefreshCw } from 'lucide-react'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import DataTable from '../../components/ui/DataTable'
import { useAuthStore } from '../../stores/auth'
import { api } from '../../lib/utils'
import { useTranslation } from 'react-i18next'
import { toDateLocale } from '../../i18n/locale'
import type { ColumnDef } from '@tanstack/react-table'

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
      const data = await api<Payment[]>('/admin/payments')
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

  const columns = useMemo<ColumnDef<Payment, unknown>[]>(
    () => [
      {
        accessorKey: 'id',
        header: () => t('admin.payments.paymentId'),
        cell: ({ row }) => <span className="text-text font-mono">{row.original.id.slice(0, 8)}</span>,
      },
      {
        accessorKey: 'amount',
        header: () => t('common.amount'),
        cell: ({ row }) => (
          <span className="text-text">{t('common.currency')}{row.original.amount.toFixed(2)}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: () => t('common.status'),
        cell: ({ row }) => (
          <Badge variant={getStatusVariant(row.original.status)}>
            {t(`status.${row.original.status}`, { defaultValue: row.original.status })}
          </Badge>
        ),
      },
      {
        accessorKey: 'method',
        header: () => t('admin.payments.method'),
        cell: ({ row }) => (
          <span className="text-text-secondary capitalize">{row.original.method}</span>
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
          row.original.status === 'completed' ? (
            <Button size="sm" variant="outline" onClick={() => openRefundModal(row.original)}>
              <RefreshCw className="w-3 h-3 mr-1" />
              {t('admin.payments.refund')}
            </Button>
          ) : null
        ),
      },
    ],
    [t, locale]
  )

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-text">{t('admin.payments.title')}</h1>

      <Card>
        <DataTable
          columns={columns}
          data={payments}
          loading={loading}
          emptyText={t('admin.payments.noPayments')}
          skeletonCols={6}
        />
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
