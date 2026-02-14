import { useFetch } from '../../hooks/useFetch'
import type { Service } from '../../types/models'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { Server } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function Services() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const { data, loading } = useFetch<{ services: Service[] }>('/portal/services')
  const services = data?.services ?? []

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

  if (loading) {
    return (
      <div className="space-y-6">
        <div><div className="h-9 w-48 animate-pulse bg-surface-hover/50 rounded" /><div className="h-5 w-64 animate-pulse bg-surface-hover/50 rounded mt-2" /></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3].map(i => <SkeletonCard key={i} />)}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text">{t('portal.services.title')}</h1>
        <p className="text-text-secondary mt-2">{t('portal.services.subtitle')}</p>
      </div>

      {services.length === 0 ? (
        <Card>
          <EmptyState icon={Server} message={t('portal.services.noServices')} />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <Card key={service.id} hover className="cursor-pointer" onClick={() => navigate(`/portal/services/${service.id}`)}>
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
