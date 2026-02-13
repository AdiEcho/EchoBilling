import { useEffect, useState } from 'react'
import { useAuthStore } from '../../stores/auth'
import { api } from '../../lib/utils'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { Server } from 'lucide-react'
import { useTranslation } from 'react-i18next'

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
  const { t } = useTranslation()

  useEffect(() => {
    const fetchServices = async () => {
      if (!token) return

      try {
        const data = await api<{ services: Service[] }>('/portal/services', { token })
        setServices(data.services)
      } catch (err) {
        console.error('Failed to fetch services:', err)
      } finally {
        setLoading(false)
      }
    }

    void fetchServices()
  }, [token])

  if (loading) {
    return <div className="text-text-secondary">{t('common.loading')}</div>
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text">{t('portal.services.title')}</h1>
        <p className="text-text-secondary mt-2">{t('portal.services.subtitle')}</p>
      </div>

      {services.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Server className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <p className="text-text-secondary">{t('portal.services.noServices')}</p>
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
                    <span className="text-xs text-text-secondary">
                      {t(`status.${service.status}`, { defaultValue: service.status })}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-text-secondary">{t('portal.services.ipAddress')}</p>
                    <p className="text-sm text-text font-mono">{service.ip_address}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary">{t('portal.services.plan')}</p>
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
