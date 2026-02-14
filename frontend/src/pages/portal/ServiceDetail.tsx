import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Server } from 'lucide-react'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { useAuthStore } from '../../stores/auth'
import { api } from '../../lib/utils'
import { useTranslation } from 'react-i18next'
import { toDateLocale } from '../../i18n/locale'

interface ServiceDetail {
  id: string
  hostname: string
  ip_address: string
  plan_name: string
  status: string
  expires_at: string
  created_at: string
}

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const token = useAuthStore((state) => state.token)
  const [service, setService] = useState<ServiceDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { t, i18n } = useTranslation()
  const locale = toDateLocale(i18n.language)

  useEffect(() => {
    const fetchService = async () => {
      if (!token || !id) return
      try {
        const data = await api<ServiceDetail>(`/portal/services/${id}`, { token })
        setService(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : t('portal.serviceDetail.failed'))
      } finally {
        setLoading(false)
      }
    }
    void fetchService()
  }, [token, id, t])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-cta'
      case 'stopped': return 'bg-danger'
      case 'suspended': return 'bg-warning'
      default: return 'bg-text-muted'
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active': return 'success'
      case 'stopped': return 'danger'
      case 'suspended': return 'warning'
      default: return 'default'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  if (error || !service) {
    return (
      <div className="space-y-6">
        <Card className="text-center py-12">
          <p className="text-text-secondary mb-4">{error || t('portal.serviceDetail.notFound')}</p>
          <Button variant="outline" onClick={() => navigate('/portal/services')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('common.goBack')}
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/portal/services')}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          {t('common.goBack')}
        </Button>
        <h1 className="text-3xl font-bold text-text">{t('portal.serviceDetail.title')}</h1>
      </div>

      {/* Status Card */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Server className="w-8 h-8 text-primary" />
            <div>
              <h2 className="text-xl font-bold text-text">{service.hostname}</h2>
              <p className="text-sm text-text-secondary">{service.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full ${getStatusColor(service.status)} ${
                service.status === 'active' ? 'animate-pulse' : ''
              }`}
            />
            <Badge variant={getStatusVariant(service.status) as 'success' | 'danger' | 'warning' | 'default'}>
              {t(`status.${service.status}`, { defaultValue: service.status })}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-text mb-4">{t('portal.serviceDetail.basicInfo')}</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-text-secondary">{t('portal.services.ipAddress')}</span>
              <span className="text-text font-mono">{service.ip_address}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">{t('portal.services.plan')}</span>
              <Badge variant="info">{service.plan_name}</Badge>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-text mb-4">{t('portal.serviceDetail.dateInfo')}</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-text-secondary">{t('portal.serviceDetail.createdAt')}</span>
              <span className="text-text">{new Date(service.created_at).toLocaleDateString(locale)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">{t('portal.serviceDetail.expiresAt')}</span>
              <span className="text-text">{new Date(service.expires_at).toLocaleDateString(locale)}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
