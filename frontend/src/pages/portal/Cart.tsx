import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingCart, Trash2, CreditCard } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { SkeletonTable } from '../../components/ui/Skeleton'
import { useAuthStore } from '../../stores/auth'
import { api } from '../../lib/utils'
import { useTranslation } from 'react-i18next'

interface CartItem {
  id: string
  plan_name: string
  specs: string
  quantity: number
  unit_price: number
  billing_cycle: string
}

interface CartData {
  order_id: string
  items: CartItem[]
  total: number
}

export default function Cart() {
  const navigate = useNavigate()
  const token = useAuthStore((state) => state.token)
  const [cart, setCart] = useState<CartData | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkingOut, setCheckingOut] = useState(false)
  const { t } = useTranslation()

  const fetchCart = async () => {
    if (!token) return
    try {
      const data = await api<CartData>('/cart', { token })
      setCart(data)
    } catch (err) {
      console.error('Failed to fetch cart:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchCart()
  }, [token])

  const handleRemoveItem = async (itemId: string) => {
    if (!token) return
    try {
      await api(`/cart/items/${itemId}`, { method: 'DELETE', token })
      void fetchCart()
    } catch (err) {
      console.error('Failed to remove item:', err)
    }
  }

  const handleCheckout = async () => {
    if (!token || !cart) return
    setCheckingOut(true)
    try {
      const data = await api<{ session_url: string }>('/checkout/session', {
        method: 'POST',
        token,
        body: JSON.stringify({ order_id: cart.order_id }),
      })
      window.location.href = data.session_url
    } catch (err) {
      console.error('Checkout failed:', err)
      setCheckingOut(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-text">{t('cart.title')}</h1>
        <Card><SkeletonTable rows={3} cols={5} /></Card>
      </div>
    )
  }

  const items = cart?.items ?? []

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-text">{t('cart.title')}</h1>

      {items.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <ShoppingCart className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <p className="text-text-secondary mb-4">{t('cart.empty')}</p>
            <Button variant="primary" onClick={() => navigate('/pricing')}>
              {t('cart.browsePlans')}
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-text-secondary font-medium">{t('cart.plan')}</th>
                    <th className="text-left py-3 px-4 text-text-secondary font-medium">{t('cart.billingCycle')}</th>
                    <th className="text-right py-3 px-4 text-text-secondary font-medium">{t('cart.quantity')}</th>
                    <th className="text-right py-3 px-4 text-text-secondary font-medium">{t('cart.unitPrice')}</th>
                    <th className="text-right py-3 px-4 text-text-secondary font-medium">{t('cart.subtotal')}</th>
                    <th className="text-right py-3 px-4 text-text-secondary font-medium">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-border/50 last:border-0">
                      <td className="py-3 px-4">
                        <div className="text-text font-medium">{item.plan_name}</div>
                        {item.specs && <div className="text-xs text-text-secondary">{item.specs}</div>}
                      </td>
                      <td className="py-3 px-4 text-text-secondary">
                        {t(`cart.cycle_${item.billing_cycle}`, { defaultValue: item.billing_cycle })}
                      </td>
                      <td className="py-3 px-4 text-text text-right">{item.quantity}</td>
                      <td className="py-3 px-4 text-text text-right">{t('common.currency')}{item.unit_price}</td>
                      <td className="py-3 px-4 text-text font-medium text-right">
                        {t('common.currency')}{(item.quantity * item.unit_price).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          className="text-red-500 hover:text-red-400"
                          onClick={() => void handleRemoveItem(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Total & Checkout */}
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary">{t('cart.total')}</p>
                <p className="text-3xl font-bold text-text">{t('common.currency')}{cart?.total}</p>
              </div>
              <Button variant="cta" size="lg" onClick={() => void handleCheckout()} disabled={checkingOut}>
                <CreditCard className="w-5 h-5 mr-2" />
                {checkingOut ? t('cart.processing') : t('cart.checkout')}
              </Button>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
