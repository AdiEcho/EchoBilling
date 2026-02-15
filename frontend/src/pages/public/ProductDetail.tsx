import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Check,
  ChevronDown,
  Cpu,
  HardDrive,
  Shield,
  Clock,
  Globe,
  Headphones,
  Zap,
} from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { Skeleton, SkeletonCard } from '../../components/ui/Skeleton'
import { useFetch } from '../../hooks/useFetch'
import { api } from '../../lib/utils'
import { useAuthStore } from '../../stores/auth'
import { useTranslation } from 'react-i18next'
import type { ProductWithPlans, ProductPlan } from '../../types/models'

// ---- helpers ----

type BillingCycle = 'monthly' | 'quarterly' | 'annually'

function formatRam(mb: number): string {
  return mb >= 1024 ? `${(mb / 1024).toFixed(mb % 1024 === 0 ? 0 : 1)} GB` : `${mb} MB`
}

function formatPrice(price: string): string {
  const n = parseFloat(price)
  if (isNaN(n)) return '$0.00'
  return `$${n.toFixed(2)}`
}

function parseFeatures(features: unknown): string[] {
  if (Array.isArray(features)) return features.filter((f): f is string => typeof f === 'string')
  if (typeof features === 'string') {
    try {
      const parsed = JSON.parse(features)
      if (Array.isArray(parsed)) return parsed.filter((f): f is string => typeof f === 'string')
    } catch {
      return features.split(',').map((s) => s.trim()).filter(Boolean)
    }
  }
  return []
}

function getPriceForCycle(plan: ProductPlan, cycle: BillingCycle): string {
  switch (cycle) {
    case 'quarterly':
      return plan.price_quarterly
    case 'annually':
      return plan.price_annually
    default:
      return plan.price_monthly
  }
}

// ---- feature icons map ----
const featureIcons = [Cpu, HardDrive, Shield, Clock, Globe, Headphones] as const
const featureKeys = ['performance', 'storage', 'security', 'uptime', 'network', 'support'] as const

// ---- FAQ keys ----
const faqKeys = ['whatIsVps', 'migration', 'uptime', 'billing', 'support'] as const

// ---- component ----

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const token = useAuthStore((state) => state.token)
  const { t } = useTranslation()

  const { data: product, loading, error } = useFetch<ProductWithPlans>(`/products/${slug}`)

  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly')
  const [addingToCart, setAddingToCart] = useState<string | null>(null)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  // ---- loading skeleton ----
  if (loading) {
    return (
      <div className="min-h-screen bg-bg">
        {/* Hero skeleton */}
        <div className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <Skeleton className="h-8 w-48 mx-auto rounded-full" />
            <Skeleton className="h-12 w-96 mx-auto" />
            <Skeleton className="h-6 w-[28rem] mx-auto" />
            <Skeleton className="h-12 w-48 mx-auto rounded-xl" />
          </div>
        </div>
        {/* Cards skeleton */}
        <div className="max-w-7xl mx-auto px-4 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ---- error state ----
  if (error || !product) {
    return (
      <div className="min-h-screen py-20 px-4 bg-bg flex items-center justify-center">
        <Card className="max-w-md text-center">
          <h2 className="font-heading text-2xl font-bold text-text mb-2">
            {t('productDetail.notFound')}
          </h2>
          <p className="text-text-secondary mb-6">
            {error || t('productDetail.notFoundDescription')}
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="primary" onClick={() => window.history.back()}>
              {t('common.goBack')}
            </Button>
            <Button variant="outline" onClick={() => navigate('/pricing')}>
              {t('vpsLanding.error.browsePlans')}
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const plans = product.plans.filter((p) => p.is_active).sort((a, b) => a.sort_order - b.sort_order)

  const handleOrder = (plan: ProductPlan) => {
    if (!token) {
      navigate('/login')
      return
    }
    setAddingToCart(plan.id)
    void api('/cart/items', {
      method: 'POST',
      token,
      body: JSON.stringify({ plan_id: plan.id, billing_cycle: billingCycle, quantity: 1 }),
    })
      .then(() => navigate('/portal/cart'))
      .catch(() => {})
      .finally(() => setAddingToCart(null))
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* ===== 1. Hero ===== */}
      <section className="relative overflow-hidden py-24 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-cta/10 pointer-events-none" />
        <div className="relative max-w-4xl mx-auto text-center">
          <span className="inline-block px-4 py-1.5 mb-6 text-sm font-medium rounded-full bg-primary/10 text-primary">
            {t('vpsLanding.hero.badge')}
          </span>
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-text mb-4">
            {product.name}
          </h1>
          <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-8">
            {product.description}
          </p>
          <a
            href="#pricing"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-cta hover:bg-cta-hover text-white font-medium transition-all duration-200"
          >
            <Zap className="w-5 h-5" />
            {t('vpsLanding.hero.cta')}
          </a>
        </div>
      </section>

      {/* ===== 2. Features ===== */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-text text-center mb-12">
            {t('vpsLanding.features.title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featureKeys.map((key, i) => {
              const Icon = featureIcons[i]
              return (
                <Card key={key} className="text-center">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-text mb-2">
                    {t(`vpsLanding.features.${key}.title`)}
                  </h3>
                  <p className="text-text-secondary text-sm">
                    {t(`vpsLanding.features.${key}.description`)}
                  </p>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===== 3. Pricing ===== */}
      <section id="pricing" className="py-20 px-4 bg-surface/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-text mb-3">
              {t('vpsLanding.pricing.title')}
            </h2>
            <p className="text-text-secondary mb-8">{t('vpsLanding.pricing.subtitle')}</p>

            {/* billing cycle switcher */}
            <div className="inline-flex rounded-xl bg-surface border border-border p-1 gap-1">
              {(['monthly', 'quarterly', 'annually'] as const).map((cycle) => (
                <button
                  key={cycle}
                  onClick={() => setBillingCycle(cycle)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    billingCycle === cycle
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-text-secondary hover:text-text'
                  }`}
                >
                  {t(`vpsLanding.pricing.${cycle}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan, idx) => {
              const isPopular = idx === 1
              const price = getPriceForCycle(plan, billingCycle)
              const planFeatures = parseFeatures(plan.features)

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl bg-surface/80 backdrop-blur-sm p-6 shadow-sm border flex flex-col ${
                    isPopular
                      ? 'border-cta ring-2 ring-cta/20'
                      : 'border-border/50'
                  }`}
                >
                  {isPopular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-semibold rounded-full bg-cta text-white">
                      {t('vpsLanding.pricing.mostPopular')}
                    </span>
                  )}

                  <div className="flex-1">
                    <h3 className="font-heading text-xl font-bold text-text mb-1">{plan.name}</h3>
                    {plan.description && (
                      <p className="text-text-secondary text-sm mb-4">{plan.description}</p>
                    )}

                    <div className="mb-6">
                      <span className="text-4xl font-bold text-text">{formatPrice(price)}</span>
                      <span className="text-text-secondary text-sm">
                        /{t(`vpsLanding.pricing.${billingCycle}`)}
                      </span>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center text-text-secondary text-sm">
                        <Check className="w-4 h-4 text-cta mr-2 flex-shrink-0" />
                        <span>{t('vpsLanding.pricing.cores', { count: plan.cpu_cores })}</span>
                      </div>
                      <div className="flex items-center text-text-secondary text-sm">
                        <Check className="w-4 h-4 text-cta mr-2 flex-shrink-0" />
                        <span>{formatRam(plan.memory_mb)}</span>
                      </div>
                      <div className="flex items-center text-text-secondary text-sm">
                        <Check className="w-4 h-4 text-cta mr-2 flex-shrink-0" />
                        <span>{plan.disk_gb} GB SSD</span>
                      </div>
                      <div className="flex items-center text-text-secondary text-sm">
                        <Check className="w-4 h-4 text-cta mr-2 flex-shrink-0" />
                        <span>{plan.bandwidth_tb} TB {t('vpsLanding.comparison.bandwidth')}</span>
                      </div>
                      {parseFloat(plan.setup_fee) > 0 && (
                        <div className="flex items-center text-text-secondary text-sm">
                          <Check className="w-4 h-4 text-cta mr-2 flex-shrink-0" />
                          <span>
                            {t('vpsLanding.pricing.setupFee')}: {formatPrice(plan.setup_fee)}
                          </span>
                        </div>
                      )}
                    </div>

                    {planFeatures.length > 0 && (
                      <div className="border-t border-border pt-4 mb-6">
                        <div className="space-y-2">
                          {planFeatures.map((feature, fi) => (
                            <div key={fi} className="flex items-center text-sm text-text-secondary">
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
                    disabled={addingToCart === plan.id}
                    onClick={() => handleOrder(plan)}
                  >
                    {addingToCart === plan.id
                      ? t('common.loading')
                      : t('vpsLanding.pricing.orderNow')}
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===== 4. Comparison Table ===== */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-text text-center mb-12">
            {t('vpsLanding.comparison.title')}
          </h2>
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-surface/50">
                    <th className="text-left py-4 px-6 text-text font-medium">
                      {t('common.feature')}
                    </th>
                    {plans.map((plan) => (
                      <th key={plan.id} className="text-center py-4 px-6 text-text font-medium">
                        {plan.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="py-3 px-6 text-text-secondary">{t('vpsLanding.comparison.cpu')}</td>
                    {plans.map((plan) => (
                      <td key={plan.id} className="text-center py-3 px-6 text-text">
                        {plan.cpu_cores} vCPU
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 px-6 text-text-secondary">{t('vpsLanding.comparison.memory')}</td>
                    {plans.map((plan) => (
                      <td key={plan.id} className="text-center py-3 px-6 text-text">
                        {formatRam(plan.memory_mb)}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 px-6 text-text-secondary">{t('vpsLanding.comparison.disk')}</td>
                    {plans.map((plan) => (
                      <td key={plan.id} className="text-center py-3 px-6 text-text">
                        {plan.disk_gb} GB
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 px-6 text-text-secondary">{t('vpsLanding.comparison.bandwidth')}</td>
                    {plans.map((plan) => (
                      <td key={plan.id} className="text-center py-3 px-6 text-text">
                        {plan.bandwidth_tb} TB
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 px-6 text-text-secondary">{t('vpsLanding.comparison.monthlyPrice')}</td>
                    {plans.map((plan) => (
                      <td key={plan.id} className="text-center py-3 px-6 text-text font-semibold">
                        {formatPrice(plan.price_monthly)}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 px-6 text-text-secondary">{t('vpsLanding.comparison.quarterlyPrice')}</td>
                    {plans.map((plan) => (
                      <td key={plan.id} className="text-center py-3 px-6 text-text font-semibold">
                        {formatPrice(plan.price_quarterly)}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 px-6 text-text-secondary">{t('vpsLanding.comparison.annuallyPrice')}</td>
                    {plans.map((plan) => (
                      <td key={plan.id} className="text-center py-3 px-6 text-text font-semibold">
                        {formatPrice(plan.price_annually)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-6 text-text-secondary">{t('vpsLanding.comparison.setupFee')}</td>
                    {plans.map((plan) => (
                      <td key={plan.id} className="text-center py-3 px-6 text-text">
                        {parseFloat(plan.setup_fee) > 0
                          ? formatPrice(plan.setup_fee)
                          : t('vpsLanding.comparison.free')}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </section>

      {/* ===== 5. FAQ ===== */}
      <section className="py-20 px-4 bg-surface/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-text text-center mb-12">
            {t('vpsLanding.faq.title')}
          </h2>
          <div className="space-y-3">
            {faqKeys.map((key, i) => {
              const isOpen = openFaq === i
              return (
                <div
                  key={key}
                  className="rounded-xl border border-border bg-surface/80 backdrop-blur-sm overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full flex items-center justify-between px-6 py-4 text-left"
                  >
                    <span className="font-medium text-text">
                      {t(`vpsLanding.faq.${key}.question`)}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-text-secondary flex-shrink-0 ml-4 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-200 ${
                      isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <p className="px-6 pb-4 text-text-secondary text-sm leading-relaxed">
                      {t(`vpsLanding.faq.${key}.answer`)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===== 6. CTA ===== */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="rounded-2xl bg-gradient-to-r from-primary/10 via-cta/10 to-primary/10 p-12 border border-border/50">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-text mb-4">
              {t('vpsLanding.cta.title')}
            </h2>
            <p className="text-text-secondary mb-8 max-w-2xl mx-auto">
              {t('vpsLanding.cta.description')}
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-cta hover:bg-cta-hover text-white font-medium transition-all duration-200"
            >
              {t('vpsLanding.cta.button')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
