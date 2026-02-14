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

interface Order {
  id: string
  status: string
  total: number
  created_at: string
}

export default function Orders() {
  const token = useAuthStore((state) => state.token)
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const limit = 10
  const { t, i18n } = useTranslation()
  const locale = toDateLocale(i18n.language)

  useEffect(() => {
    const fetchOrders = async () => {
      if (!token) return

      setLoading(true)
      try {
        const data = await api<{ orders: Order[]; total: number }>(
          `/portal/orders?page=${page}&limit=${limit}`
        )
        setOrders(data.orders)
        setTotalPages(Math.ceil(data.total / limit))
      } catch (err) {
        console.error('Failed to fetch orders:', err)
      } finally {
        setLoading(false)
      }
    }

    void fetchOrders()
  }, [token, page])

  const statusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'success'
      case 'pending_payment':
        return 'warning'
      case 'paid':
        return 'info'
      case 'cancelled':
        return 'danger'
      default:
        return 'default'
    }
  }

  const columns = useMemo<ColumnDef<Order, unknown>[]>(
    () => [
      {
        accessorKey: 'id',
        header: () => t('portal.orders.orderId'),
        cell: ({ row }) => (
          <span className="text-text font-mono">{row.original.id.substring(0, 8)}...</span>
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
          <Button variant="ghost" size="sm" onClick={() => navigate(`/portal/orders/${row.original.id}`)}>
            <Eye className="w-4 h-4 mr-1" />
            {t('portal.orders.view')}
          </Button>
        ),
      },
    ],
    [t, locale, navigate]
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text">{t('portal.orders.title')}</h1>
        <p className="text-text-secondary mt-2">{t('portal.orders.subtitle')}</p>
      </div>

      <Card>
        <DataTable
          columns={columns}
          data={orders}
          loading={loading}
          emptyText={t('portal.orders.noOrders')}
          pagination={{ page, totalPages, onPageChange: setPage }}
        />
      </Card>
    </div>
  )
}
