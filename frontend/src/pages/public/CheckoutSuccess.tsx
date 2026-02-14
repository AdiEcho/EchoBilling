import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { useTranslation } from 'react-i18next'

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const { t } = useTranslation()

  return (
    <div className="min-h-screen py-20 px-4 bg-bg flex items-center justify-center">
      <Card className="max-w-md text-center">
        <CheckCircle className="w-16 h-16 text-cta mx-auto mb-4" />
        <h1 className="font-heading text-2xl font-bold text-text mb-2">{t('checkout.successTitle')}</h1>
        <p className="text-text-secondary mb-6">{t('checkout.successMessage')}</p>
        {sessionId && (
          <p className="text-xs text-text-muted mb-4">
            {t('checkout.sessionId')}: {sessionId}
          </p>
        )}
        <div className="flex gap-3 justify-center">
          <Link to="/portal/orders">
            <Button variant="primary">{t('checkout.viewOrders')}</Button>
          </Link>
          <Link to="/portal/dashboard">
            <Button variant="outline">{t('checkout.backToDashboard')}</Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
