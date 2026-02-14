import { useMemo } from 'react'
import { useAuthStore } from '../../stores/auth'
import { useFetch } from '../../hooks/useFetch'
import { getStatusVariant, formatId } from '../../lib/status'
import type { PortalStats, Order } from '../../types/models'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import StatCard from '../../components/ui/StatCard'
import DataTable from '../../components/ui/DataTable'
import { SkeletonCard, SkeletonTable } from '../../components/ui/Skeleton'
import { Server, ShoppingCart, FileText, DollarSign } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toDateLocale } from '../../i18n/locale'
import type { ColumnDef } from '@tanstack/react-table'

export default function Dashboard() {
  const user = useAuthStore((state) => state.user)
  const { t, i18n } = useTranslation()
  const locale = toDateLocale(i18n.language)

  const { data: stats, loading: statsLoading } = useFetch<PortalStats>('/portal/stats')
  const { data: ordersData, loading: ordersLoading } = useFetch<{ orders: Order[] }>('/portal/orders?limit=5')
  const recentOrders = ordersData?.orders ?? []

  const loading = statsLoading || ordersLoading

  const statCards = [
    {
      title: t('portal.dashboard.activeServices'),
      value: stats?.active_services ?? 0,
      icon: Server,
      iconColor: 'text-cta',
      iconBg: 'bg-cta/10',
    },
    {
      title: t('portal.dashboard.pendingOrders'),
      value: stats?.pending_orders ?? 0,
      icon: ShoppingCart,
      iconColor: 'text-warning',
      iconBg: 'bg-warning/10',
    },
    {
      title: t('portal.dashboard.unpaidInvoices'),
      value: stats?.unpaid_invoices ?? 0,
      icon: FileText,
      iconColor: 'text-danger',
      iconBg: 'bg-danger/10',
    },
    {
      title: t('portal.dashboard.totalSpent'),
      value: `${t('common.currency')}${stats?.total_spent ?? 0}`,
      icon: DollarSign,
      iconColor: 'text-primary',
      iconBg: 'bg-primary/10',
    },
  ]

  const columns = useMemo<ColumnDef<Order, unknown>[]>(
    () => [
      {
        accessorKey: 'id',
        header: () => t('portal.dashboard.orderId'),
        cell: ({ row }) => (
          <span className="text-text font-mono">{formatId(row.original.id)}...</span>
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
    ],
    [t, locale],
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div><div className="h-9 w-64 animate-pulse bg-surface-hover/50 rounded" /><div className="h-5 w-48 animate-pulse bg-surface-hover/50 rounded mt-2" /></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">{[1,2,3,4].map(i => <SkeletonCard key={i} />)}</div>
        <Card><SkeletonTable rows={5} cols={4} /></Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text">
          {t('portal.dashboard.welcome', { name: user?.name ?? user?.email ?? '' })}
        </h1>
        <p className="text-text-secondary mt-2">{t('portal.dashboard.overview')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <Card>
        <h2 className="text-xl font-semibold text-text mb-4">{t('portal.dashboard.recentOrders')}</h2>
        <DataTable
          columns={columns}
          data={recentOrders}
          emptyText={t('portal.dashboard.noOrders')}
        />
      </Card>
    </div>
  )
}
