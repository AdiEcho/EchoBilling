import { useEffect, useState } from 'react'
import { useAuthStore } from '../../stores/auth'
import { api } from '../../lib/utils'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { Eye } from 'lucide-react'

interface Invoice {
  id: string
  invoice_number: string
  status: string
  total: number
  created_at: string
}

export default function Invoices() {
  const token = useAuthStore((state) => state.token)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!token) return

      try {
        const data = await api<{ invoices: Invoice[] }>('/portal/invoices', { token })
        setInvoices(data.invoices)
      } catch (err) {
        console.error('获取账单失败:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchInvoices()
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

  const statusText = (status: string) => {
    switch (status) {
      case 'paid':
        return '已支付'
      case 'pending':
        return '待支付'
      case 'overdue':
        return '逾期'
      case 'cancelled':
        return '已取消'
      default:
        return status
    }
  }

  if (loading) {
    return <div className="text-text-secondary">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text">账单</h1>
        <p className="text-text-secondary mt-2">查看和管理您的账单</p>
      </div>

      <Card>
        {invoices.length === 0 ? (
          <p className="text-text-secondary text-center py-8">暂无账单</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">账单号</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">状态</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">金额</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">日期</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">操作</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-border/50 last:border-0">
                    <td className="py-3 px-4 text-sm text-text font-mono">
                      {invoice.invoice_number}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={statusVariant(invoice.status)}>{statusText(invoice.status)}</Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-text">¥{invoice.total}</td>
                    <td className="py-3 px-4 text-sm text-text-secondary">
                      {new Date(invoice.created_at).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="py-3 px-4">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        查看
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
