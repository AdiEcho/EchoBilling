import { useEffect, useState } from 'react'
import { Users, ShoppingCart, DollarSign, Server } from 'lucide-react'
import Card from '../../components/ui/Card'
import { useAuthStore } from '../../stores/auth'
import { api } from '../../lib/utils'

interface DashboardStats {
  total_customers: number
  total_orders: number
  revenue: number
  active_services: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const token = useAuthStore((state) => state.token)

  useEffect(() => {
    const fetchStats = async () => {
      if (!token) return
      try {
        const data = await api<DashboardStats>('/admin/dashboard', { token })
        setStats(data)
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [token])

  const statCards = [
    {
      title: 'Total Customers',
      value: stats?.total_customers ?? 0,
      icon: Users,
      color: 'text-primary',
    },
    {
      title: 'Total Orders',
      value: stats?.total_orders ?? 0,
      icon: ShoppingCart,
      color: 'text-cta',
    },
    {
      title: 'Revenue',
      value: `$${stats?.revenue?.toFixed(2) ?? '0.00'}`,
      icon: DollarSign,
      color: 'text-yellow-500',
    },
    {
      title: 'Active Services',
      value: stats?.active_services ?? 0,
      icon: Server,
      color: 'text-blue-500',
    },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-text">Admin Dashboard</h1>

      {loading ? (
        <div className="text-text-secondary">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm">{stat.title}</p>
                  <p className="text-2xl font-bold text-text mt-1">{stat.value}</p>
                </div>
                <stat.icon className={`w-10 h-10 ${stat.color}`} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
