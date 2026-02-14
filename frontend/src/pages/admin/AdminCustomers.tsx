import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { SkeletonTable } from '../../components/ui/Skeleton'
import { useAuthStore } from '../../stores/auth'
import { api } from '../../lib/utils'
import { useTranslation } from 'react-i18next'
import { toDateLocale } from '../../i18n/locale'

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
  const [totalPages] = useState(5)
  const token = useAuthStore((state) => state.token)
  const { t, i18n } = useTranslation()
  const locale = toDateLocale(i18n.language)

  useEffect(() => {
    const fetchCustomers = async () => {
      if (!token) return
      try {
        const data = await api<Customer[]>(`/admin/customers?page=${page}`, { token })
        setCustomers(data)
      } catch (error) {
        console.error('Failed to fetch customers:', error)
      } finally {
        setLoading(false)
      }
    }
    void fetchCustomers()
  }, [token, page])

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-text">{t('admin.customers.title')}</h1>

      <Card>
        {loading ? (
          <SkeletonTable rows={5} cols={5} />
        ) : customers.length === 0 ? (
          <div className="text-text-secondary p-4">{t('admin.customers.noCustomers')}</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-text-secondary font-medium">{t('common.name')}</th>
                    <th className="text-left py-3 px-4 text-text-secondary font-medium">{t('common.email')}</th>
                    <th className="text-left py-3 px-4 text-text-secondary font-medium">{t('admin.customers.role')}</th>
                    <th className="text-left py-3 px-4 text-text-secondary font-medium">
                      {t('admin.customers.joinedDate')}
                    </th>
                    <th className="text-left py-3 px-4 text-text-secondary font-medium">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="border-b border-border hover:bg-surface/50 transition-colors"
                    >
                      <td className="py-3 px-4 text-text">{customer.name}</td>
                      <td className="py-3 px-4 text-text-secondary">{customer.email}</td>
                      <td className="py-3 px-4 text-text-secondary capitalize">
                        {t(`status.${customer.role}`, { defaultValue: customer.role })}
                      </td>
                      <td className="py-3 px-4 text-text-secondary">
                        {new Date(customer.created_at).toLocaleDateString(locale)}
                      </td>
                      <td className="py-3 px-4">
                        <button className="text-primary hover:text-primary/80 text-sm">
                          {t('admin.customers.view')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between p-4 border-t border-border">
              <div className="text-text-secondary text-sm">{t('common.pageInfo', { page, total: totalPages })}</div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
