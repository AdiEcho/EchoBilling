import { useEffect, useState } from 'react'
import { Activity, Database, Zap, Cpu } from 'lucide-react'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { SkeletonCard, SkeletonTable } from '../../components/ui/Skeleton'
import { useAuthStore } from '../../stores/auth'
import { api } from '../../lib/utils'
import { useTranslation } from 'react-i18next'
import { toDateLocale } from '../../i18n/locale'

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
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const token = useAuthStore((state) => state.token)
  const { t, i18n } = useTranslation()
  const locale = toDateLocale(i18n.language)

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return
      try {
        const [sysData, jobsData] = await Promise.all([
          api<SystemInfo>('/admin/system', { token }),
          api<Job[]>('/admin/system/jobs', { token }).catch(() => [] as Job[]),
        ])
        setSystemInfo(sysData)
        setJobs(jobsData)
      } catch (error) {
        console.error('Failed to fetch system info:', error)
      } finally {
        setLoading(false)
      }
    }
    void fetchData()
  }, [token])

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'completed':
        return 'success'
      case 'degraded':
      case 'pending':
      case 'running':
        return 'warning'
      case 'down':
      case 'failed':
        return 'danger'
      default:
        return 'default'
    }
  }

  const systemCards = [
    {
      title: t('admin.system.apiVersion'),
      value: systemInfo?.api_version ?? t('status.unknown'),
      icon: Activity,
      color: 'text-primary',
    },
    {
      title: t('admin.system.database'),
      value: systemInfo?.database_status ?? 'unknown',
      icon: Database,
      color: 'text-cta',
      badge: true,
    },
    {
      title: t('admin.system.redis'),
      value: systemInfo?.redis_status ?? 'unknown',
      icon: Zap,
      color: 'text-yellow-500',
      badge: true,
    },
    {
      title: t('admin.system.worker'),
      value: systemInfo?.worker_status ?? 'unknown',
      icon: Cpu,
      color: 'text-blue-500',
      badge: true,
    },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-text">{t('admin.system.title')}</h1>

      {loading ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
          <Card><SkeletonTable rows={3} cols={4} /></Card>
        </>
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
                        {t(`status.${card.value}`, { defaultValue: card.value })}
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
            <h2 className="text-xl font-bold text-text mb-4">{t('admin.system.recentJobs')}</h2>
            {jobs.length === 0 ? (
              <div className="text-text-secondary">{t('admin.system.noJobs')}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-text-secondary font-medium">{t('admin.system.jobId')}</th>
                      <th className="text-left py-3 px-4 text-text-secondary font-medium">{t('common.name')}</th>
                      <th className="text-left py-3 px-4 text-text-secondary font-medium">{t('common.status')}</th>
                      <th className="text-left py-3 px-4 text-text-secondary font-medium">{t('admin.system.created')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map((job) => (
                      <tr key={job.id} className="border-b border-border hover:bg-surface/50 transition-colors">
                        <td className="py-3 px-4 text-text font-mono">{job.id.slice(0, 8)}</td>
                        <td className="py-3 px-4 text-text">{job.name}</td>
                        <td className="py-3 px-4">
                          <Badge variant={getStatusVariant(job.status)}>
                            {t(`status.${job.status}`, { defaultValue: job.status })}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-text-secondary">
                          {new Date(job.created_at).toLocaleString(locale)}
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
