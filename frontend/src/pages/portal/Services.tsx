import { useEffect, useState } from 'react'
import { useAuthStore } from '../../stores/auth'
import { api } from '../../lib/utils'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { Server } from 'lucide-react'

interface Service {
  id: string
  hostname: string
  ip_address: string
  plan_name: string
  status: string
}

export default function Services() {
  const token = useAuthStore((state) => state.token)
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchServices = async () => {
      if (!token) return

      try {
        const data = await api<{ services: Service[] }>('/portal/services', { token })
        setServices(data.services)
      } catch (err) {
        console.error('获取服务失败:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchServices()
  }, [token])

  if (loading) {
    return <div className="text-text-secondary">加载中...</div>
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-cta'
      case 'stopped':
        return 'bg-danger'
      case 'suspended':
        return 'bg-warning'
      default:
        return 'bg-text-muted'
    }
  }

  const statusText = (status: string) => {
    switch (status) {
      case 'active':
        return '运行中'
      case 'stopped':
        return '已停止'
      case 'suspended':
        return '已暂停'
      default:
        return status
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text">我的服务</h1>
        <p className="text-text-secondary mt-2">管理您的所有服务实例</p>
      </div>

      {services.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Server className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <p className="text-text-secondary">暂无服务</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <Card key={service.id} hover>
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-text">{service.hostname}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${getStatusColor(service.status)} ${
                        service.status === 'active' ? 'animate-pulse' : ''
                      }`}
                    />
                    <span className="text-xs text-text-secondary">{statusText(service.status)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-text-secondary">IP 地址</p>
                    <p className="text-sm text-text font-mono">{service.ip_address}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary">套餐</p>
                    <Badge variant="info">{service.plan_name}</Badge>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
