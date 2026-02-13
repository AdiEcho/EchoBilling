import { useEffect, useState } from 'react'
import { Filter } from 'lucide-react'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { useAuthStore } from '../../stores/auth'
import { api } from '../../lib/utils'

interface Order {
  id: string
  customer_name: string
  customer_email: string
  status: 'pending' | 'processing' | 'completed' | 'cancelled'
  amount: number
  created_at: string
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const token = useAuthStore((state) => state.token)

  useEffect(() => {
    const fetchOrders = async () => {
      if (!token) return
      try {
        const data = await api<Order[]>('/admin/orders', { token })
        setOrders(data)
      } catch (error) {
        console.error('Failed to fetch orders:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [token])

  const filteredOrders =
    statusFilter === 'all' ? orders : orders.filter((o) => o.status === statusFilter)

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success'
      case 'processing':
        return 'warning'
      case 'cancelled':
        return 'danger'
      default:
        return 'default'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-text">Orders Management</h1>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-text-secondary" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-surface border border-border rounded-lg px-3 py-2 text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <Card>
        {loading ? (
          <div className="text-text-secondary p-4">Loading...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-text-secondary p-4">No orders found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">Order ID</th>
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">Customer</th>
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">Amount</th>
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-border hover:bg-surface/50 transition-colors"
                  >
                    <td className="py-3 px-4 text-text font-mono">{order.id.slice(0, 8)}</td>
                    <td className="py-3 px-4">
                      <div>
                        <div className="text-text">{order.customer_name}</div>
                        <div className="text-text-secondary text-xs">{order.customer_email}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
                    </td>
                    <td className="py-3 px-4 text-text">${order.amount.toFixed(2)}</td>
                    <td className="py-3 px-4 text-text-secondary">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <button className="text-primary hover:text-primary/80 text-sm">View</button>
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
