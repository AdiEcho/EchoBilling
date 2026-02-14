import { useMemo } from 'react'
import { useFetch } from '../../hooks/useFetch'
import { getStatusVariant, formatId } from '../../lib/status'
import type { AdminDashboardStats, AdminOrder } from '../../types/models'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import StatCard from '../../components/ui/StatCard'
import DataTable from '../../components/ui/DataTable'
import { SkeletonCard, SkeletonTable } from '../../components/ui/Skeleton'
import { Users, ShoppingCart, DollarSign, Server } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toDateLocale } from '../../i18n/locale'
import type { ColumnDef } from '@tanstack/react-table'

export default function AdminDashboard() {
  const { t, i18n } = useTranslation()
  const locale = toDateLocale(i18n.language)

  const { data: stats, loading: statsLoading } = useFetch<AdminDashboardStats>('/admin/dashboard')
  const { data: ordersData, loading: ordersLoading } = useFetch<{ orders: AdminOrder[] }>('/admin/orders?limit=5')
  const recentOrders = ordersData?.orders ?? []

  const loading = statsLoading || ordersLoading

  const statCards = [
    {
      title: t('admin.dashboard.totalCustomers'),
      value: stats?.total_customers ?? 0,
      icon: Users,
      iconColor: 'text-primary',
      iconBg: 'bg-primary/10',
    },
    {
      title: t('admin.dashboard.totalOrders'),
      value: stats?.total_orders ?? 0,
      icon: ShoppingCart,
      iconColor: 'text-cta',
      iconBg: 'bg-cta/10',
    },
    {
      title: t('admin.dashboard.revenue'),
      value: `${t('common.currency')}${stats?.revenue?.toFixed(2) ?? '0.00'}`,
      icon: DollarSign,
      iconColor: 'text-warning',
      iconBg: 'bg-warning/10',
    },
    {
      title: t('admin.dashboard.activeServices'),
      value: stats?.active_services ?? 0,
      icon: Server,
      iconColor: 'text-info',
      iconBg: 'bg-info/10',
    },
  ]

  const columns = useMemo<ColumnDef<AdminOrder, unknown>[]>(
    () => [
      {
        accessorKey: 'id',
        header: () => t('portal.dashboard.orderId'),
        cell: ({ row }) => (
          <span className="text-text font-mono">{formatId(row.original.id)}...</span>
        ),
      },
      {
        accessorKey: 'customer_name',
        header: () => t('common.customer', { defaultValue: 'Customer' }),
        cell: ({ row }) => (
          <span className="text-text">{row.original.customer_name}</span>
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
          <span className="text-text">{t('common.currency')}{row.original.amount}</span>
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
        <div className="h-9 w-64 animate-pulse bg-surface-hover/50 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
        <Card><SkeletonTable rows={5} cols={5} /></Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-text">{t('admin.dashboard.title')}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <Card>
        <h2 className="text-xl font-semibold text-text mb-4">
          {t('admin.dashboard.recentOrders', { defaultValue: 'Recent Orders' })}
        </h2>
        <DataTable
          columns={columns}
          data={recentOrders}
          emptyText={t('portal.dashboard.noOrders')}
        />
      </Card>
    </div>
  )
}
