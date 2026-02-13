import { useEffect, useState } from 'react'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { useAuthStore } from '../../stores/auth'
import { api } from '../../lib/utils'
import { useTranslation } from 'react-i18next'
import { toDateLocale } from '../../i18n/locale'

interface Invoice {
  id: string
  invoice_number: string
  customer_name: string
  customer_email: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  amount: number
  created_at: string
}

export default function AdminInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const token = useAuthStore((state) => state.token)
  const { t, i18n } = useTranslation()
  const locale = toDateLocale(i18n.language)

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!token) return
      try {
        const data = await api<Invoice[]>('/admin/invoices', { token })
        setInvoices(data)
      } catch (error) {
        console.error('Failed to fetch invoices:', error)
      } finally {
        setLoading(false)
      }
    }
    void fetchInvoices()
  }, [token])

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'paid':
        return 'success'
      case 'sent':
        return 'warning'
      case 'overdue':
        return 'danger'
      case 'draft':
        return 'default'
      case 'cancelled':
        return 'danger'
      default:
        return 'default'
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-text">{t('admin.invoices.title')}</h1>

      <Card>
        {loading ? (
          <div className="text-text-secondary p-4">{t('common.loading')}</div>
        ) : invoices.length === 0 ? (
          <div className="text-text-secondary p-4">{t('admin.invoices.noInvoices')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">
                    {t('admin.invoices.invoiceNumber')}
                  </th>
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">
                    {t('admin.invoices.customer')}
                  </th>
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">{t('common.status')}</th>
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">{t('common.amount')}</th>
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">{t('common.date')}</th>
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="border-b border-border hover:bg-surface/50 transition-colors"
                  >
                    <td className="py-3 px-4 text-text font-mono">{invoice.invoice_number}</td>
                    <td className="py-3 px-4">
                      <div>
                        <div className="text-text">{invoice.customer_name}</div>
                        <div className="text-text-secondary text-xs">{invoice.customer_email}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={getStatusVariant(invoice.status)}>
                        {t(`status.${invoice.status}`, { defaultValue: invoice.status })}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-text">
                      {t('common.currency')}
                      {invoice.amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-text-secondary">
                      {new Date(invoice.created_at).toLocaleDateString(locale)}
                    </td>
                    <td className="py-3 px-4">
                      <button className="text-primary hover:text-primary/80 text-sm">
                        {t('admin.invoices.view')}
                      </button>
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
