import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { useAuthStore } from '../../stores/auth'
import { api } from '../../lib/utils'

interface Payment {
  id: string
  amount: number
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  method: string
  created_at: string
}

export default function AdminPayments() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const token = useAuthStore((state) => state.token)

  useEffect(() => {
    const fetchPayments = async () => {
      if (!token) return
      try {
        const data = await api<Payment[]>('/admin/payments', { token })
        setPayments(data)
      } catch (error) {
        console.error('Failed to fetch payments:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchPayments()
  }, [token])

  const handleRefund = (paymentId: string) => {
    console.log('Create refund for payment:', paymentId)
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success'
      case 'pending':
        return 'warning'
      case 'failed':
        return 'danger'
      case 'refunded':
        return 'default'
      default:
        return 'default'
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-text">Payments</h1>

      <Card>
        {loading ? (
          <div className="text-text-secondary p-4">Loading...</div>
        ) : payments.length === 0 ? (
          <div className="text-text-secondary p-4">No payments found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">Payment ID</th>
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">Amount</th>
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">Method</th>
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="border-b border-border hover:bg-surface/50 transition-colors"
                  >
                    <td className="py-3 px-4 text-text font-mono">{payment.id.slice(0, 8)}</td>
                    <td className="py-3 px-4 text-text">${payment.amount.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <Badge variant={getStatusVariant(payment.status)}>{payment.status}</Badge>
                    </td>
                    <td className="py-3 px-4 text-text-secondary capitalize">{payment.method}</td>
                    <td className="py-3 px-4 text-text-secondary">
                      {new Date(payment.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      {payment.status === 'completed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRefund(payment.id)}
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Refund
                        </Button>
                      )}
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
