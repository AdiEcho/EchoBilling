import { useEffect, useState } from 'react'
import { useAuthStore } from '../../stores/auth'
import { api } from '../../lib/utils'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { Eye, ChevronLeft, ChevronRight } from 'lucide-react'

interface Order {
  id: string
  status: string
  total: number
  created_at: string
}

export default function Orders() {
  const token = useAuthStore((state) => state.token)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const limit = 10

  useEffect(() => {
    const fetchOrders = async () => {
      if (!token) return

      setLoading(true)
      try {
        const data = await api<{ orders: Order[]; total: number }>(
          `/portal/orders?page=${page}&limit=${limit}`,
          { token }
        )
        setOrders(data.orders)
        setTotalPages(Math.ceil(data.total / limit))
      } catch (err) {
        console.error('获取订单失败:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
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

  const statusText = (status: string) => {
    switch (status) {
      case 'draft':
        return '草稿'
      case 'pending_payment':
        return '待支付'
      case 'paid':
        return '已支付'
      case 'active':
        return '活跃'
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
        <h1 className="text-3xl font-bold text-text">我的订单</h1>
        <p className="text-text-secondary mt-2">查看和管理您的所有订单</p>
      </div>

      <Card>
        {orders.length === 0 ? (
          <p className="text-text-secondary text-center py-8">暂无订单</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">订单 ID</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">状态</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">金额</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">日期</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-border/50 last:border-0">
                      <td className="py-3 px-4 text-sm text-text font-mono">
                        {order.id.substring(0, 8)}...
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={statusVariant(order.status)}>{statusText(order.status)}</Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-text">¥{order.total}</td>
                      <td className="py-3 px-4 text-sm text-text-secondary">
                        {new Date(order.created_at).toLocaleDateString('zh-CN')}
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

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <p className="text-sm text-text-secondary">
                  第 {page} 页，共 {totalPages} 页
                </p>
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
            )}
          </>
        )}
      </Card>
    </div>
  )
}
