import { useEffect, useState } from 'react'
import { Activity, Database, Zap, Cpu } from 'lucide-react'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { useAuthStore } from '../../stores/auth'
import { api } from '../../lib/utils'

interface SystemInfo {
  api_version: string
  database_status: 'healthy' | 'degraded' | 'down'
  redis_status: 'healthy' | 'degraded' | 'down'
  worker_status: 'healthy' | 'degraded' | 'down'
}

interface Job {
  id: string
  name: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  created_at: string
}

export default function AdminSystem() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
  const [jobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const token = useAuthStore((state) => state.token)

  useEffect(() => {
    const fetchSystemInfo = async () => {
      if (!token) return
      try {
        const data = await api<SystemInfo>('/admin/system', { token })
        setSystemInfo(data)
      } catch (error) {
        console.error('Failed to fetch system info:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchSystemInfo()
  }, [token])

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'success'
      case 'degraded':
        return 'warning'
      case 'down':
        return 'danger'
      default:
        return 'default'
    }
  }

  const systemCards = [
    {
      title: 'API Version',
      value: systemInfo?.api_version ?? 'N/A',
      icon: Activity,
      color: 'text-primary',
    },
    {
      title: 'Database',
      value: systemInfo?.database_status ?? 'unknown',
      icon: Database,
      color: 'text-cta',
      badge: true,
    },
    {
      title: 'Redis',
      value: systemInfo?.redis_status ?? 'unknown',
      icon: Zap,
      color: 'text-yellow-500',
      badge: true,
    },
    {
      title: 'Worker',
      value: systemInfo?.worker_status ?? 'unknown',
      icon: Cpu,
      color: 'text-blue-500',
      badge: true,
    },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-text">System</h1>

      {loading ? (
        <div className="text-text-secondary">Loading...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {systemCards.map((card) => (
              <Card key={card.title}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-secondary text-sm">{card.title}</p>
                    {card.badge ? (
                      <Badge variant={getStatusVariant(card.value)} className="mt-2">
                        {card.value}
                      </Badge>
                    ) : (
                      <p className="text-xl font-bold text-text mt-1">{card.value}</p>
                    )}
                  </div>
                  <card.icon className={`w-10 h-10 ${card.color}`} />
                </div>
              </Card>
            ))}
          </div>

          <Card>
            <h2 className="text-xl font-bold text-text mb-4">Recent Jobs</h2>
            {jobs.length === 0 ? (
              <div className="text-text-secondary">No recent jobs</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-text-secondary font-medium">
                        Job ID
                      </th>
                      <th className="text-left py-3 px-4 text-text-secondary font-medium">Name</th>
                      <th className="text-left py-3 px-4 text-text-secondary font-medium">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 text-text-secondary font-medium">
                        Created
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map((job) => (
                      <tr
                        key={job.id}
                        className="border-b border-border hover:bg-surface/50 transition-colors"
                      >
                        <td className="py-3 px-4 text-text font-mono">{job.id.slice(0, 8)}</td>
                        <td className="py-3 px-4 text-text">{job.name}</td>
                        <td className="py-3 px-4">
                          <Badge variant={getStatusVariant(job.status)}>{job.status}</Badge>
                        </td>
                        <td className="py-3 px-4 text-text-secondary">
                          {new Date(job.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
