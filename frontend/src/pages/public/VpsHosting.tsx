import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Cpu,
  HardDrive,
  Shield,
  Clock,
  Globe,
  Headphones,
  Zap,
  Server,
  Network,
  Lock,
  MonitorUp,
  Gauge,
  ChevronDown,
  ArrowRight,
  Terminal,
  Database,
  Gamepad2,
  ShoppingCart,
  Bot,
  Cloud,
  RefreshCw,
  Camera,
} from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { useFetch } from '../../hooks/useFetch'
import { useTranslation } from 'react-i18next'
import { useBrandingStore } from '../../stores/branding'
import type { ProductWithPlans } from '../../types/models'

// ---- use case icons ----
const useCaseIcons = [Terminal, Database, Gamepad2, ShoppingCart, Bot, Cloud] as const
const useCaseKeys = ['webHosting', 'database', 'gameServer', 'ecommerce', 'aiDev', 'saas'] as const

// ---- feature icons ----
const featureIcons = [Cpu, HardDrive, Shield, Clock, Globe, Network, Lock, Headphones] as const
const featureKeys = [
  'performance',
  'storage',
  'security',
  'uptime',
  'global',
  'network',
  'isolation',
  'support',
] as const

// ---- deploy feature icons ----
const deployIcons = [Zap, MonitorUp, Camera, RefreshCw, Gauge, Server] as const
const deployKeys = [
  'instant',
  'os',
  'snapshot',
  'backup',
  'scaling',
  'api',
] as const

// ---- FAQ keys ----
const faqKeys = ['whatIsVps', 'vsShared', 'chooseSpec', 'migration', 'uptime', 'billing', 'support', 'refund'] as const

export default function VpsHosting() {
  const { t } = useTranslation()
  const siteName = useBrandingStore((s) => s.siteName)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const { data: products } = useFetch<ProductWithPlans[]>('/products')
  const activeProducts = products?.filter((p) => p.is_active) ?? []

  return (
    <div className="min-h-screen bg-bg">
      {/* ===== 1. Hero ===== */}
      <section className="relative overflow-hidden py-24 md:py-32 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-cta/5 pointer-events-none" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-cta/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center">
          <span className="inline-block px-4 py-1.5 mb-6 text-sm font-medium rounded-full bg-primary/10 text-primary">
            {t('vpsPage.hero.badge')}
          </span>
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-text mb-6 leading-tight">
            {t('vpsPage.hero.title')}{' '}
            <span className="text-primary">{t('vpsPage.hero.highlight')}</span>
          </h1>
          <p className="text-lg md:text-xl text-text-secondary max-w-3xl mx-auto mb-10">
            {t('vpsPage.hero.description', { siteName })}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/pricing">
              <Button variant="cta" size="lg" className="text-lg px-8 py-4 gap-2">
                <Zap className="w-5 h-5" />
                {t('vpsPage.hero.cta')}
              </Button>
            </Link>
            <a href="#products">
              <Button variant="outline" size="lg" className="text-lg px-8 py-4 gap-2">
                {t('vpsPage.hero.viewPlans')}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ===== 2. Stats Bar ===== */}
      <section className="py-12 px-4 border-y border-border bg-surface/30">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {(['datacenters', 'uptime', 'customers', 'deployed'] as const).map((key) => (
            <div key={key} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
                {t(`vpsPage.stats.${key}.value`)}
              </div>
              <div className="text-sm text-text-secondary">
                {t(`vpsPage.stats.${key}.label`)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== 3. Product Tiers ===== */}
      <section id="products" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-text mb-4">
              {t('vpsPage.products.title')}
            </h2>
            <p className="text-text-secondary max-w-2xl mx-auto">
              {t('vpsPage.products.subtitle')}
            </p>
          </div>

          {activeProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeProducts.map((product) => (
                <Link key={product.id} to={`/vps/${product.slug}`} className="group">
                  <Card hover className="h-full flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                        <Server className="w-6 h-6" />
                      </div>
                      <h3 className="font-heading text-xl font-bold text-text">{product.name}</h3>
                    </div>
                    <p className="text-text-secondary text-sm flex-1 mb-4">
                      {product.description}
                    </p>
                    <div className="flex items-center text-primary text-sm font-medium group-hover:gap-2 transition-all">
                      {t('vpsPage.products.viewPlans')}
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(['regular', 'highPerf', 'highFreq'] as const).map((key) => (
                <Card key={key} hover className="text-center">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Server className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-heading text-xl font-bold text-text mb-2">
                    {t(`vpsPage.products.tiers.${key}.name`)}
                  </h3>
                  <p className="text-text-secondary text-sm mb-4">
                    {t(`vpsPage.products.tiers.${key}.description`)}
                  </p>
                  <div className="text-primary font-semibold text-lg">
                    {t(`vpsPage.products.tiers.${key}.startingPrice`)}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== 4. Features Grid ===== */}
      <section className="py-20 px-4 bg-surface/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-text mb-4">
              {t('vpsPage.features.title')}
            </h2>
            <p className="text-text-secondary max-w-2xl mx-auto">
              {t('vpsPage.features.subtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featureKeys.map((key, i) => {
              const Icon = featureIcons[i]
              return (
                <div
                  key={key}
                  className="group rounded-2xl bg-bg border border-border/50 p-6 hover:border-primary/30 hover:shadow-md transition-all duration-200"
                >
                  <div className="w-12 h-12 mb-4 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                    <Icon className="w-6 h-6 text-primary group-hover:text-white" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-text mb-2">
                    {t(`vpsPage.features.items.${key}.title`)}
                  </h3>
                  <p className="text-text-secondary text-sm leading-relaxed">
                    {t(`vpsPage.features.items.${key}.description`)}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===== 5. Use Cases ===== */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-text mb-4">
              {t('vpsPage.useCases.title')}
            </h2>
            <p className="text-text-secondary max-w-2xl mx-auto">
              {t('vpsPage.useCases.subtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {useCaseKeys.map((key, i) => {
              const Icon = useCaseIcons[i]
              return (
                <div
                  key={key}
                  className="rounded-2xl border border-border/50 bg-surface/50 p-6 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-lg bg-cta/10 text-cta flex-shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-heading text-lg font-semibold text-text mb-1">
                        {t(`vpsPage.useCases.items.${key}.title`)}
                      </h3>
                      <p className="text-text-secondary text-sm leading-relaxed">
                        {t(`vpsPage.useCases.items.${key}.description`)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===== 6. Deployment Features ===== */}
      <section className="py-20 px-4 bg-surface/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-text mb-4">
              {t('vpsPage.deploy.title')}
            </h2>
            <p className="text-text-secondary max-w-2xl mx-auto">
              {t('vpsPage.deploy.subtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {deployKeys.map((key, i) => {
              const Icon = deployIcons[i]
              return (
                <div key={key} className="flex items-start gap-4 p-5 rounded-xl bg-bg border border-border/50">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-text mb-1">
                      {t(`vpsPage.deploy.items.${key}.title`)}
                    </h3>
                    <p className="text-text-secondary text-sm">
                      {t(`vpsPage.deploy.items.${key}.description`)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===== 7. OS Support ===== */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-text mb-4">
              {t('vpsPage.os.title')}
            </h2>
            <p className="text-text-secondary max-w-2xl mx-auto">
              {t('vpsPage.os.subtitle')}
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {(['ubuntu', 'debian', 'centos', 'rocky', 'alma', 'fedora', 'arch', 'freebsd', 'windows', 'opensuse', 'alpine', 'custom'] as const).map(
              (os) => (
                <div
                  key={os}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border/50 bg-surface/50 hover:border-primary/30 transition-colors"
                >
                  <MonitorUp className="w-8 h-8 text-text-secondary" />
                  <span className="text-sm font-medium text-text">
                    {t(`vpsPage.os.list.${os}`)}
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* ===== 8. Global Network ===== */}
      <section className="py-20 px-4 bg-gradient-to-b from-bg to-primary/5">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-text mb-4">
            {t('vpsPage.network.title')}
          </h2>
          <p className="text-text-secondary max-w-2xl mx-auto mb-12">
            {t('vpsPage.network.subtitle')}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(['americas', 'europe', 'asiaPacific'] as const).map((region) => (
              <Card key={region} className="text-center">
                <Globe className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-heading text-lg font-semibold text-text mb-2">
                  {t(`vpsPage.network.regions.${region}.name`)}
                </h3>
                <p className="text-text-secondary text-sm">
                  {t(`vpsPage.network.regions.${region}.locations`)}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 9. FAQ ===== */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-text text-center mb-12">
            {t('vpsPage.faq.title')}
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
                      {t(`vpsPage.faq.items.${key}.question`)}
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
                      {t(`vpsPage.faq.items.${key}.answer`)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===== 10. CTA ===== */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="rounded-2xl bg-gradient-to-r from-primary/10 via-cta/10 to-primary/10 p-12 md:p-16 border border-border/50">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-text mb-4">
              {t('vpsPage.cta.title')}
            </h2>
            <p className="text-text-secondary mb-8 max-w-2xl mx-auto text-lg">
              {t('vpsPage.cta.description')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register">
                <Button variant="cta" size="lg" className="text-lg px-8 py-4 gap-2">
                  <Zap className="w-5 h-5" />
                  {t('vpsPage.cta.button')}
                </Button>
              </Link>
              <Link to="/pricing">
                <Button variant="outline" size="lg" className="text-lg px-8 py-4">
                  {t('vpsPage.cta.viewPricing')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
