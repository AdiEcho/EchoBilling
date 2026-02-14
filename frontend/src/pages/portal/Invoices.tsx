import { useMemo } from 'react'
import { useFetch } from '../../hooks/useFetch'
import { getStatusVariant } from '../../lib/status'
import type { Invoice } from '../../types/models'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import DataTable from '../../components/ui/DataTable'
import { Eye } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toDateLocale } from '../../i18n/locale'
import type { ColumnDef } from '@tanstack/react-table'

export default function Invoices() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const locale = toDateLocale(i18n.language)

  const { data, loading } = useFetch<{ invoices: Invoice[] }>('/portal/invoices')
  const invoices = data?.invoices ?? []

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
          <Badge variant={getStatusVariant(row.original.status)}>
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
    [t, locale, navigate],
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
