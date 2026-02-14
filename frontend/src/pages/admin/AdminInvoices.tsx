import { useMemo } from 'react'
import { useFetch } from '../../hooks/useFetch'
import { getStatusVariant, formatCurrency } from '../../lib/status'
import type { AdminInvoice } from '../../types/models'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import DataTable from '../../components/ui/DataTable'
import { useTranslation } from 'react-i18next'
import { toDateLocale } from '../../i18n/locale'
import type { ColumnDef } from '@tanstack/react-table'

export default function AdminInvoices() {
  const { t, i18n } = useTranslation()
  const locale = toDateLocale(i18n.language)

  const { data: invoices, loading } = useFetch<AdminInvoice[]>('/admin/invoices')

  const columns = useMemo<ColumnDef<AdminInvoice, unknown>[]>(
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
          <span className="text-text">{t('common.currency')}{formatCurrency(row.original.amount)}</span>
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
    [t, locale],
  )

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-text">{t('admin.invoices.title')}</h1>

      <Card>
        <DataTable
          columns={columns}
          data={invoices ?? []}
          loading={loading}
          emptyText={t('admin.invoices.noInvoices')}
          skeletonCols={6}
        />
      </Card>
    </div>
  )
}
