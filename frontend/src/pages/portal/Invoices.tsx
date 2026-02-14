import { useEffect, useState } from 'react'
import { useAuthStore } from '../../stores/auth'
import { api } from '../../lib/utils'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { SkeletonTable } from '../../components/ui/Skeleton'
import { Eye } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toDateLocale } from '../../i18n/locale'

interface Invoice {
  id: string
  invoice_number: string
  status: string
  total: number
  created_at: string
}

export default function Invoices() {
  const token = useAuthStore((state) => state.token)
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const { t, i18n } = useTranslation()
  const locale = toDateLocale(i18n.language)

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!token) return

      try {
        const data = await api<{ invoices: Invoice[] }>('/portal/invoices', { token })
        setInvoices(data.invoices)
      } catch (err) {
        console.error('Failed to fetch invoices:', err)
      } finally {
        setLoading(false)
      }
    }

    void fetchInvoices()
  }, [token])

  const statusVariant = (status: string) => {
    switch (status) {
      case 'paid':
        return 'success'
      case 'pending':
        return 'warning'
      case 'overdue':
        return 'danger'
      case 'cancelled':
        return 'default'
      default:
        return 'default'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div><div className="h-9 w-32 animate-pulse bg-surface-hover/50 rounded" /><div className="h-5 w-56 animate-pulse bg-surface-hover/50 rounded mt-2" /></div>
        <Card><SkeletonTable rows={5} cols={5} /></Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text">{t('portal.invoices.title')}</h1>
        <p className="text-text-secondary mt-2">{t('portal.invoices.subtitle')}</p>
      </div>

      <Card>
        {invoices.length === 0 ? (
          <p className="text-text-secondary text-center py-8">{t('portal.invoices.noInvoices')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                    {t('portal.invoices.invoiceNumber')}
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
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-border/50 last:border-0">
                    <td className="py-3 px-4 text-sm text-text font-mono">{invoice.invoice_number}</td>
                    <td className="py-3 px-4">
                      <Badge variant={statusVariant(invoice.status)}>
                        {t(`status.${invoice.status}`, { defaultValue: invoice.status })}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-text">
                      {t('common.currency')}
                      {invoice.total}
                    </td>
                    <td className="py-3 px-4 text-sm text-text-secondary">
                      {new Date(invoice.created_at).toLocaleDateString(locale)}
                    </td>
                    <td className="py-3 px-4">
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/portal/invoices/${invoice.id}`)}>
                        <Eye className="w-4 h-4 mr-1" />
                        {t('portal.invoices.view')}
                      </Button>
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
