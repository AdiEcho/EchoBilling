import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText } from 'lucide-react'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { SkeletonCard, SkeletonTable } from '../../components/ui/Skeleton'
import { useAuthStore } from '../../stores/auth'
import { api } from '../../lib/utils'
import { useTranslation } from 'react-i18next'
import { toDateLocale } from '../../i18n/locale'

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unit_price: number
  amount: number
}

interface Invoice {
  id: string
  invoice_number: string
  status: string
  subtotal: number
  tax: number
  total: number
  currency: string
  due_date: string
  paid_at: string | null
  items: InvoiceItem[]
  created_at: string
}

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const token = useAuthStore((state) => state.token)
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { t, i18n } = useTranslation()
  const locale = toDateLocale(i18n.language)

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!token || !id) return
      try {
        const data = await api<Invoice>(`/portal/invoices/${id}`)
        setInvoice(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : t('portal.invoiceDetail.failed'))
      } finally {
        setLoading(false)
      }
    }
    void fetchInvoice()
  }, [token, id, t])

  const statusVariant = (status: string) => {
    switch (status) {
      case 'paid': return 'success'
      case 'pending': case 'sent': return 'warning'
      case 'overdue': return 'danger'
      default: return 'default'
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

  if (error || !invoice) {
    return (
      <div className="space-y-6">
        <Card className="text-center py-12">
          <p className="text-text-secondary mb-4">{error || t('portal.invoiceDetail.notFound')}</p>
          <Button variant="outline" onClick={() => navigate('/portal/invoices')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('common.goBack')}
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/portal/invoices')}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          {t('common.goBack')}
        </Button>
        <h1 className="text-3xl font-bold text-text">{t('portal.invoiceDetail.title')}</h1>
      </div>

      {/* Invoice Header */}
      <Card>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary" />
            <div>
              <h2 className="text-xl font-bold text-text">{invoice.invoice_number}</h2>
              <p className="text-sm text-text-secondary">{t('portal.invoiceDetail.invoiceId')}: {invoice.id}</p>
            </div>
          </div>
          <Badge variant={statusVariant(invoice.status) as 'success' | 'warning' | 'danger' | 'default'}>
            {t(`status.${invoice.status}`, { defaultValue: invoice.status })}
          </Badge>
        </div>
      </Card>

      {/* Invoice Items */}
      <Card>
        <h2 className="text-lg font-semibold text-text mb-4">{t('portal.invoiceDetail.items')}</h2>
        {invoice.items && invoice.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">{t('common.description')}</th>
                  <th className="text-right py-3 px-4 text-text-secondary font-medium">{t('portal.invoiceDetail.quantity')}</th>
                  <th className="text-right py-3 px-4 text-text-secondary font-medium">{t('portal.invoiceDetail.unitPrice')}</th>
                  <th className="text-right py-3 px-4 text-text-secondary font-medium">{t('common.amount')}</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item) => (
                  <tr key={item.id} className="border-b border-border/50 last:border-0">
                    <td className="py-3 px-4 text-text">{item.description}</td>
                    <td className="py-3 px-4 text-text text-right">{item.quantity}</td>
                    <td className="py-3 px-4 text-text text-right">{t('common.currency')}{item.unit_price}</td>
                    <td className="py-3 px-4 text-text font-medium text-right">{t('common.currency')}{item.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-text-secondary">{t('portal.invoiceDetail.noItems')}</p>
        )}

        {/* Totals */}
        <div className="border-t border-border mt-4 pt-4 space-y-2">
          <div className="flex justify-end gap-8">
            <span className="text-text-secondary">{t('portal.invoiceDetail.subtotal')}</span>
            <span className="text-text w-24 text-right">{t('common.currency')}{invoice.subtotal}</span>
          </div>
          <div className="flex justify-end gap-8">
            <span className="text-text-secondary">{t('portal.invoiceDetail.tax')}</span>
            <span className="text-text w-24 text-right">{t('common.currency')}{invoice.tax}</span>
          </div>
          <div className="flex justify-end gap-8 pt-2 border-t border-border">
            <span className="font-semibold text-text">{t('portal.invoiceDetail.total')}</span>
            <span className="font-bold text-text text-lg w-24 text-right">{t('common.currency')}{invoice.total}</span>
          </div>
        </div>
      </Card>

      {/* Dates */}
      <Card>
        <h2 className="text-lg font-semibold text-text mb-4">{t('portal.invoiceDetail.dateInfo')}</h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-text-secondary">{t('portal.invoiceDetail.dueDate')}</span>
            <span className="text-text">{new Date(invoice.due_date).toLocaleDateString(locale)}</span>
          </div>
          {invoice.paid_at && (
            <div className="flex justify-between">
              <span className="text-text-secondary">{t('portal.invoiceDetail.paidAt')}</span>
              <span className="text-text">{new Date(invoice.paid_at).toLocaleDateString(locale)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-text-secondary">{t('portal.invoiceDetail.createdAt')}</span>
            <span className="text-text">{new Date(invoice.created_at).toLocaleDateString(locale)}</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
