import { useEffect, useState, useMemo } from 'react'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import DataTable from '../../components/ui/DataTable'
import { useAuthStore } from '../../stores/auth'
import { api } from '../../lib/utils'
import { useTranslation } from 'react-i18next'
import { toDateLocale } from '../../i18n/locale'
import type { ColumnDef } from '@tanstack/react-table'

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
        const data = await api<Invoice[]>('/admin/invoices')
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
      case 'paid': return 'success'
      case 'sent': return 'warning'
      case 'overdue': return 'danger'
      case 'draft': return 'default'
      case 'cancelled': return 'danger'
      default: return 'default'
    }
  }

  const columns = useMemo<ColumnDef<Invoice, unknown>[]>(
    () => [
      {
        accessorKey: 'invoice_number',
        header: () => t('admin.invoices.invoiceNumber'),
        cell: ({ row }) => <span className="text-text font-mono">{row.original.invoice_number}</span>,
      },
      {
        accessorKey: 'customer_name',
        header: () => t('admin.invoices.customer'),
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
          <Badge variant={getStatusVariant(row.original.status)}>
            {t(`status.${row.original.status}`, { defaultValue: row.original.status })}
          </Badge>
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
        cell: () => (
          <button className="text-primary hover:text-primary/80 text-sm">
            {t('admin.invoices.view')}
          </button>
        ),
      },
    ],
    [t, locale]
  )

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-text">{t('admin.invoices.title')}</h1>

      <Card>
        <DataTable
          columns={columns}
          data={invoices}
          loading={loading}
          emptyText={t('admin.invoices.noInvoices')}
          skeletonCols={6}
        />
      </Card>
    </div>
  )
}
