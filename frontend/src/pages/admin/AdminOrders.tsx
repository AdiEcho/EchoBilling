import { useState, useMemo, useCallback } from 'react'
import { Filter, Eye } from 'lucide-react'
import { useFetch } from '../../hooks/useFetch'
import { getStatusVariant, formatId, formatCurrency } from '../../lib/status'
import { toast } from '../../stores/toast'
import { api } from '../../lib/utils'
import type { AdminOrder } from '../../types/models'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Select from '../../components/ui/Select'
import DataTable from '../../components/ui/DataTable'
import { useTranslation } from 'react-i18next'
import { toDateLocale } from '../../i18n/locale'
import type { ColumnDef } from '@tanstack/react-table'

const STATUS_OPTIONS = ['pending', 'processing', 'completed', 'cancelled']

export default function AdminOrders() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewOrder, setViewOrder] = useState<AdminOrder | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const { t, i18n } = useTranslation()
  const locale = toDateLocale(i18n.language)

  const { data: orders, loading, refetch } = useFetch<AdminOrder[]>('/admin/orders')

  const filteredOrders =
    statusFilter === 'all' ? (orders ?? []) : (orders ?? []).filter((o) => o.status === statusFilter)

  const handleStatusUpdate = useCallback(async (orderId: string, newStatus: string) => {
    setUpdatingStatus(orderId)
    try {
      await api(`/admin/orders/${orderId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      })
      toast.success(t('admin.orders.statusUpdated'))
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.fetchError'))
    } finally {
      setUpdatingStatus(null)
    }
  }, [refetch, t])

  const columns = useMemo<ColumnDef<AdminOrder, unknown>[]>(
    () => [
      {
        accessorKey: 'id',
        header: () => t('admin.orders.orderId'),
        cell: ({ row }) => <span className="text-text font-mono">{formatId(row.original.id)}</span>,
      },
      {
        accessorKey: 'customer_name',
        header: () => t('admin.orders.customer'),
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
          <Select
            value={row.original.status}
            disabled={updatingStatus === row.original.id}
            onChange={(e) => void handleStatusUpdate(row.original.id, e.target.value)}
            options={STATUS_OPTIONS.map((s) => ({
              value: s,
              label: t(`status.${s}`, { defaultValue: s }),
            }))}
            className="w-auto text-xs py-1"
          />
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
        cell: ({ row }) => (
          <Button variant="ghost" size="sm" onClick={() => setViewOrder(row.original)}>
            <Eye className="w-4 h-4 mr-1" />
            {t('admin.orders.view')}
          </Button>
        ),
      },
    ],
    [t, locale, updatingStatus, handleStatusUpdate],
  )

  const filterOptions = [
    { value: 'all', label: t('admin.orders.filters.all') },
    { value: 'pending', label: t('admin.orders.filters.pending') },
    { value: 'processing', label: t('admin.orders.filters.processing') },
    { value: 'completed', label: t('admin.orders.filters.completed') },
    { value: 'cancelled', label: t('admin.orders.filters.cancelled') },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-text">{t('admin.orders.title')}</h1>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-text-secondary" />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={filterOptions}
            className="w-auto"
          />
        </div>
      </div>

      <Card>
        <DataTable
          columns={columns}
          data={filteredOrders}
          loading={loading}
          emptyText={t('admin.orders.noOrders')}
          skeletonCols={6}
        />
      </Card>

      {/* Order Detail Modal */}
      <Modal open={!!viewOrder} onClose={() => setViewOrder(null)} title={`${t('admin.orders.orderId')}: ${viewOrder ? formatId(viewOrder.id) : ''}`}>
        {viewOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-text-secondary">{t('admin.orders.customer')}</p>
                <p className="text-text">{viewOrder.customer_name}</p>
                <p className="text-text-secondary text-xs">{viewOrder.customer_email}</p>
              </div>
              <div>
                <p className="text-text-secondary">{t('common.status')}</p>
                <Badge variant={getStatusVariant(viewOrder.status)}>
                  {t(`status.${viewOrder.status}`, { defaultValue: viewOrder.status })}
                </Badge>
              </div>
              <div>
                <p className="text-text-secondary">{t('common.amount')}</p>
                <p className="text-text font-bold">{t('common.currency')}{formatCurrency(viewOrder.amount)}</p>
              </div>
              <div>
                <p className="text-text-secondary">{t('common.date')}</p>
                <p className="text-text">{new Date(viewOrder.created_at).toLocaleDateString(locale)}</p>
              </div>
            </div>
            {viewOrder.items && viewOrder.items.length > 0 && (
              <div>
                <p className="text-sm font-medium text-text mb-2">{t('admin.orders.orderItems')}</p>
                <div className="space-y-1">
                  {viewOrder.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-text">{item.plan_name} x{item.quantity}</span>
                      <span className="text-text-secondary">{t('common.currency')}{item.unit_price}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
