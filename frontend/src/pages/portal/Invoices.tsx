import { useEffect, useState, useMemo } from 'react'
import { useAuthStore } from '../../stores/auth'
import { api } from '../../lib/utils'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import DataTable from '../../components/ui/DataTable'
import { Eye } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toDateLocale } from '../../i18n/locale'
import type { ColumnDef } from '@tanstack/react-table'

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

  const columns = useMemo<ColumnDef<Invoice, unknown>[]>(
    () => [
      {
        accessorKey: 'invoice_number',
        header: () => t('portal.invoices.invoiceNumber'),
        cell: ({ row }) => (
          <span className="text-text font-mono">{row.original.invoice_number}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: () => t('common.status'),
        cell: ({ row }) => (
          <Badge variant={statusVariant(row.original.status)}>
            {t(`status.${row.original.status}`, { defaultValue: row.original.status })}
          </Badge>
        ),
      },
      {
        accessorKey: 'total',
        header: () => t('common.amount'),
        cell: ({ row }) => (
          <span className="text-text">{t('common.currency')}{row.original.total}</span>
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
          <Button variant="ghost" size="sm" onClick={() => navigate(`/portal/invoices/${row.original.id}`)}>
            <Eye className="w-4 h-4 mr-1" />
            {t('portal.invoices.view')}
          </Button>
        ),
      },
    ],
    [t, locale, navigate]
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text">{t('portal.invoices.title')}</h1>
        <p className="text-text-secondary mt-2">{t('portal.invoices.subtitle')}</p>
      </div>

      <Card>
        <DataTable
          columns={columns}
          data={invoices}
          loading={loading}
          emptyText={t('portal.invoices.noInvoices')}
        />
      </Card>
    </div>
  )
}
