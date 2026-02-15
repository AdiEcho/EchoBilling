import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { api } from '../../lib/utils'
import { useAuthStore } from '../../stores/auth'
import { toast } from '../../stores/toast'
import { useTranslation } from 'react-i18next'

interface Plan {
  id: string
  name: string
  price_monthly: number
  cpu_cores: number
  memory_mb: number
  disk_gb: number
  bandwidth_tb: number
  features: string[]
}

interface Product {
  id: string
  name: string
  slug: string
  plans: Plan[]
}

export default function Pricing() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const token = useAuthStore((state) => state.token)
  const [plans, setPlans] = useState<(Plan & { product_slug: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [addingToCart, setAddingToCart] = useState<string | null>(null)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const products = await api<Product[]>('/products')
        const planResults = await Promise.all(
          products.map((product) =>
            api<Plan[]>(`/products/${product.id}/plans`)
              .then((plans) => plans.map((plan) => ({ ...plan, product_slug: product.slug })))
              .catch(() => [] as (Plan & { product_slug: string })[])
          )
        )
        setPlans(planResults.flat())
      } catch (error) {
        toast.error(t('common.fetchError'))
      } finally {
        setLoading(false)
      }
    }
    void fetchProducts()
  }, [])

  const handleCta = async (plan: Plan & { product_slug: string }) => {
    if (!token) {
      navigate('/login')
      return
    }
    setAddingToCart(plan.id)
    try {
      await api('/cart/items', {
        method: 'POST',
        token,
        body: JSON.stringify({ plan_id: plan.id, billing_cycle: 'monthly', quantity: 1 }),
      })
      navigate('/portal/cart')
    } catch (err) {
      toast.error(t('common.fetchError'))
    } finally {
      setAddingToCart(null)
    }
  }

  const formatRam = (mb: number) => mb >= 1024 ? `${mb / 1024}GB RAM` : `${mb}MB RAM`

  return (
    <div className="min-h-screen py-20 px-4 bg-bg">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-text mb-4">
            {t('pricing.title')}
          </h1>
          <p className="text-xl text-text-secondary">{t('pricing.subtitle')}</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonCard key={i} className="h-96" />
            ))}
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center text-text-secondary py-12">{t('common.noData')}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan, idx) => {
              const isPopular = idx === 1
              return (
                <div key={plan.id} className={isPopular ? 'relative rounded-2xl bg-gradient-to-br from-primary via-cta to-primary p-[2px]' : ''}>
                <Card
                  hover
                  className={`relative flex flex-col h-full ${
                    isPopular ? 'shadow-lg shadow-primary/20' : ''
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                      <span className="inline-flex items-center whitespace-nowrap rounded-full bg-gradient-to-r from-primary to-cta px-4 py-1 text-xs font-semibold text-white shadow-md shadow-primary/30">
                        {t('pricing.mostPopular')}
                      </span>
                    </div>
                  )}

                  <div className="flex-1">
                    <h3 className="font-heading text-2xl font-bold text-text mb-2">{plan.name}</h3>
                    <div className="mb-6">
                      <span className="text-4xl font-bold text-text">${plan.price_monthly}</span>
                      <span className="text-text-secondary">{t('common.month')}</span>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center text-text-secondary">
                        <Check className="w-4 h-4 text-cta mr-2 flex-shrink-0" />
                        <span>{plan.cpu_cores} vCPU</span>
                      </div>
                      <div className="flex items-center text-text-secondary">
                        <Check className="w-4 h-4 text-cta mr-2 flex-shrink-0" />
                        <span>{formatRam(plan.memory_mb)}</span>
                      </div>
                      <div className="flex items-center text-text-secondary">
                        <Check className="w-4 h-4 text-cta mr-2 flex-shrink-0" />
                        <span>{plan.disk_gb}GB NVMe SSD</span>
                      </div>
                      <div className="flex items-center text-text-secondary">
                        <Check className="w-4 h-4 text-cta mr-2 flex-shrink-0" />
                        <span>{plan.bandwidth_tb}TB {t('common.bandwidth')}</span>
                      </div>
                    </div>

                    {plan.features && plan.features.length > 0 && (
                      <div className="border-t border-border pt-4 mb-6">
                        <p className="text-sm font-medium text-text mb-3">{t('pricing.includedFeatures')}</p>
                        <div className="space-y-2">
                          {plan.features.map((feature, fIdx) => (
                            <div key={fIdx} className="flex items-center text-sm text-text-secondary">
                              <Check className="w-4 h-4 text-cta mr-2 flex-shrink-0" />
                              <span>{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <Button
                    variant={isPopular ? 'cta' : 'primary'}
                    className="w-full"
                    onClick={() => void handleCta(plan)}
                    disabled={addingToCart === plan.id}
                  >
                    {addingToCart === plan.id ? t('common.loading') : t('pricing.cta')}
                  </Button>
                </Card>
                </div>
              )
            })}
          </div>
        )}

        <div className="mt-12 text-center">
          <p className="text-text-secondary">{t('pricing.footnote')}</p>
        </div>
      </div>
    </div>
  )
}
