import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { CreditCard, Shield } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function BillingMethods() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text">{t('portal.billing.title')}</h1>
        <p className="text-text-secondary mt-2">{t('portal.billing.subtitle')}</p>
      </div>

      <Card>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-text mb-2">{t('portal.billing.stripeTitle')}</h2>
            <p className="text-text-secondary text-sm mb-4">{t('portal.billing.stripeDescription')}</p>
            <Button variant="primary">{t('portal.billing.manageButton')}</Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-cta/10 flex items-center justify-center flex-shrink-0">
            <Shield className="w-6 h-6 text-cta" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-text mb-2">{t('portal.billing.pciTitle')}</h2>
            <p className="text-text-secondary text-sm">{t('portal.billing.pciDescription')}</p>
          </div>
        </div>
      </Card>

      <Card className="bg-surface/50">
        <h3 className="text-sm font-medium text-text mb-2">{t('portal.billing.supportedTitle')}</h3>
        <div className="flex flex-wrap gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-surface border border-border text-xs text-text-secondary">
            {t('portal.billing.methods.creditCard')}
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-surface border border-border text-xs text-text-secondary">
            {t('portal.billing.methods.debitCard')}
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-surface border border-border text-xs text-text-secondary">
            {t('portal.billing.methods.alipay')}
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-surface border border-border text-xs text-text-secondary">
            {t('portal.billing.methods.wechatPay')}
          </div>
        </div>
      </Card>
    </div>
  )
}
