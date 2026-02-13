import { Check } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { useTranslation } from 'react-i18next'

export default function Pricing() {
  const { t } = useTranslation()

  const plans = [
    {
      key: 'starter',
      price: 5,
      popular: false,
      features: ['rootAccess', 'ddos', 'sla999', 'ipv4v6'],
    },
    {
      key: 'pro',
      price: 20,
      popular: true,
      features: ['rootAccess', 'ddos', 'sla9999', 'ipv4v6', 'prioritySupport', 'freeBackups'],
    },
    {
      key: 'business',
      price: 40,
      popular: false,
      features: ['rootAccess', 'ddos', 'sla9999', 'ipv4v6', 'prioritySupport', 'freeBackups', 'dedicatedIp'],
    },
    {
      key: 'enterprise',
      price: 80,
      popular: false,
      features: [
        'rootAccess',
        'ddos',
        'sla9999',
        'ipv4v6',
        'prioritySupport',
        'freeBackups',
        'dedicatedIp',
        'customSolutions',
      ],
    },
  ]

  return (
    <div className="min-h-screen py-20 px-4 bg-bg">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-text mb-4">
            {t('pricing.title')}
          </h1>
          <p className="text-xl text-text-secondary">{t('pricing.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.key}
              hover
              className={`relative flex flex-col ${
                plan.popular ? 'border-primary shadow-lg shadow-primary/20' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="info" className="px-3 py-1">
                    {t('pricing.mostPopular')}
                  </Badge>
                </div>
              )}

              <div className="flex-1">
                <h3 className="font-heading text-2xl font-bold text-text mb-2">
                  {t(`pricing.plans.${plan.key}.name`)}
                </h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-text">${plan.price}</span>
                  <span className="text-text-secondary">{t('common.month')}</span>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-text-secondary">
                    <Check className="w-4 h-4 text-cta mr-2 flex-shrink-0" />
                    <span>{t(`pricing.plans.${plan.key}.specs.cpu`)}</span>
                  </div>
                  <div className="flex items-center text-text-secondary">
                    <Check className="w-4 h-4 text-cta mr-2 flex-shrink-0" />
                    <span>{t(`pricing.plans.${plan.key}.specs.ram`)}</span>
                  </div>
                  <div className="flex items-center text-text-secondary">
                    <Check className="w-4 h-4 text-cta mr-2 flex-shrink-0" />
                    <span>{t(`pricing.plans.${plan.key}.specs.storage`)}</span>
                  </div>
                  <div className="flex items-center text-text-secondary">
                    <Check className="w-4 h-4 text-cta mr-2 flex-shrink-0" />
                    <span>{t(`pricing.plans.${plan.key}.specs.bandwidth`)}</span>
                  </div>
                </div>

                <div className="border-t border-border pt-4 mb-6">
                  <p className="text-sm font-medium text-text mb-3">{t('pricing.includedFeatures')}</p>
                  <div className="space-y-2">
                    {plan.features.map((featureKey) => (
                      <div key={featureKey} className="flex items-center text-sm text-text-secondary">
                        <Check className="w-4 h-4 text-cta mr-2 flex-shrink-0" />
                        <span>{t(`pricing.featureLabels.${featureKey}`)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Button variant={plan.popular ? 'cta' : 'primary'} className="w-full">
                {t('pricing.cta')}
              </Button>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-text-secondary">{t('pricing.footnote')}</p>
        </div>
      </div>
    </div>
  )
}
