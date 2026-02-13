import { Link } from 'react-router-dom'
import { HardDrive, Wifi, Shield, Clock, Globe, Headphones } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { useTranslation } from 'react-i18next'

export default function Home() {
  const { t } = useTranslation()

  const features = [
    { icon: HardDrive, key: 'storage' },
    { icon: Wifi, key: 'network' },
    { icon: Shield, key: 'ddos' },
    { icon: Clock, key: 'uptime' },
    { icon: Globe, key: 'global' },
    { icon: Headphones, key: 'support' },
  ]

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden bg-gradient-to-b from-bg via-surface/20 to-bg py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold text-text mb-6">
            {t('home.hero.title')}{' '}
            <span className="text-primary">{t('home.hero.highlight')}</span>
          </h1>
          <p className="text-xl md:text-2xl text-text-secondary max-w-3xl mx-auto mb-10">
            {t('home.hero.description')}
          </p>
          <Link to="/pricing">
            <Button variant="cta" size="lg" className="text-lg px-8 py-4">
              {t('home.hero.cta')}
            </Button>
          </Link>
        </div>
      </section>

      <section className="py-20 px-4 bg-bg">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-text text-center mb-12">
            {t('home.features.title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <Card key={feature.key} hover className="group">
                  <div className="flex flex-col items-start">
                    <div className="p-3 rounded-lg bg-primary/10 text-primary mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-heading text-xl font-semibold text-text mb-2">
                      {t(`home.features.items.${feature.key}.title`)}
                    </h3>
                    <p className="text-text-secondary">{t(`home.features.items.${feature.key}.description`)}</p>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-gradient-to-b from-bg to-surface/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-text mb-6">
            {t('home.cta.title')}
          </h2>
          <p className="text-xl text-text-secondary mb-8">{t('home.cta.description')}</p>
          <Link to="/pricing">
            <Button variant="cta" size="lg" className="text-lg px-8 py-4">
              {t('home.cta.button')}
            </Button>
          </Link>
        </div>
      </section>

      <section className="py-16 px-4 bg-surface/50">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-text-secondary text-lg">{t('home.trust')}</p>
        </div>
      </section>
    </div>
  )
}
