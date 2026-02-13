import { useEffect, useState } from 'react'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { useAuthStore } from '../../stores/auth'
import { api } from '../../lib/utils'

interface Invoice {
  id: string
  invoice_number: string
  customer_name: string
  customer_email: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  amount: number
  created_at: string
}

export default function AdminInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const token = useAuthStore((state) => state.token)

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!token) return
      try {
        const data = await api<Invoice[]>('/admin/invoices', { token })
        setInvoices(data)
      } catch (error) {
        console.error('Failed to fetch invoices:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchInvoices()
  }, [token])

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'paid':
        return 'success'
      case 'sent':
        return 'warning'
      case 'overdue':
        return 'danger'
      case 'draft':
        return 'default'
      case 'cancelled':
        return 'danger'
      default:
        return 'default'
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-text">Invoices</h1>

      <Card>
        {loading ? (
          <div className="text-text-secondary p-4">Loading...</div>
        ) : invoices.length === 0 ? (
          <div className="text-text-secondary p-4">No invoices found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">Invoice #</th>
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">Customer</th>
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">Amount</th>
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="border-b border-border hover:bg-surface/50 transition-colors"
                  >
                    <td className="py-3 px-4 text-text font-mono">{invoice.invoice_number}</td>
                    <td className="py-3 px-4">
                      <div>
                        <div className="text-text">{invoice.customer_name}</div>
                        <div className="text-text-secondary text-xs">{invoice.customer_email}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={getStatusVariant(invoice.status)}>{invoice.status}</Badge>
                    </td>
                    <td className="py-3 px-4 text-text">${invoice.amount.toFixed(2)}</td>
                    <td className="py-3 px-4 text-text-secondary">
                      {new Date(invoice.created_at).toLocaleDateString()}
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
