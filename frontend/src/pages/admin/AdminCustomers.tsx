import { useEffect, useState, useMemo } from 'react'
import Card from '../../components/ui/Card'
import DataTable from '../../components/ui/DataTable'
import { useAuthStore } from '../../stores/auth'
import { api } from '../../lib/utils'
import { useTranslation } from 'react-i18next'
import { toDateLocale } from '../../i18n/locale'
import type { ColumnDef } from '@tanstack/react-table'

interface Customer {
  id: string
  name: string
  email: string
  role: string
  created_at: string
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const token = useAuthStore((state) => state.token)
  const { t, i18n } = useTranslation()
  const locale = toDateLocale(i18n.language)

  useEffect(() => {
    const fetchCustomers = async () => {
      if (!token) return
      try {
        const data = await api<{ customers: Customer[]; total: number }>(`/admin/customers?page=${page}`)
        setCustomers(data.customers)
        setTotalPages(Math.ceil(data.total / 10))
      } catch (error) {
        console.error('Failed to fetch customers:', error)
      } finally {
        setLoading(false)
      }
    }
    void fetchCustomers()
  }, [token, page])

  const columns = useMemo<ColumnDef<Customer, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: () => t('common.name'),
        cell: ({ row }) => <span className="text-text">{row.original.name}</span>,
      },
      {
        accessorKey: 'email',
        header: () => t('common.email'),
        cell: ({ row }) => <span className="text-text-secondary">{row.original.email}</span>,
      },
      {
        accessorKey: 'role',
        header: () => t('admin.customers.role'),
        cell: ({ row }) => (
          <span className="text-text-secondary capitalize">
            {t(`status.${row.original.role}`, { defaultValue: row.original.role })}
          </span>
        ),
      },
      {
        accessorKey: 'created_at',
        header: () => t('admin.customers.joinedDate'),
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
            {t('admin.customers.view')}
          </button>
        ),
      },
    ],
    [t, locale]
  )

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-text">{t('admin.customers.title')}</h1>

      <Card>
        <DataTable
          columns={columns}
          data={customers}
          loading={loading}
          emptyText={t('admin.customers.noCustomers')}
          pagination={{ page, totalPages, onPageChange: setPage }}
        />
      </Card>
    </div>
  )
}
