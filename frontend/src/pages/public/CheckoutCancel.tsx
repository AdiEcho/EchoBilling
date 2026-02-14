import { Link } from 'react-router-dom'
import { XCircle } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { useTranslation } from 'react-i18next'

export default function CheckoutCancel() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen py-20 px-4 bg-bg flex items-center justify-center">
      <Card className="max-w-md text-center">
        <XCircle className="w-16 h-16 text-warning mx-auto mb-4" />
        <h1 className="font-heading text-2xl font-bold text-text mb-2">{t('checkout.cancelTitle')}</h1>
        <p className="text-text-secondary mb-6">{t('checkout.cancelMessage')}</p>
        <div className="flex gap-3 justify-center">
          <Link to="/portal/cart">
            <Button variant="primary">{t('checkout.backToCart')}</Button>
          </Link>
          <Link to="/pricing">
            <Button variant="outline">{t('checkout.browsePlans')}</Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
