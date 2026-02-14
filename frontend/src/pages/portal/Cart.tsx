import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingCart, Trash2, CreditCard } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import DataTable from '../../components/ui/DataTable'
import { SkeletonTable } from '../../components/ui/Skeleton'
import { useAuthStore } from '../../stores/auth'
import { api } from '../../lib/utils'
import { toast } from '../../stores/toast'
import { useTranslation } from 'react-i18next'
import type { ColumnDef } from '@tanstack/react-table'

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
      const data = await api<CartData>('/cart')
      setCart(data)
    } catch (err) {
      toast.error(t('common.fetchError'))
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
      await api(`/cart/items/${itemId}`, { method: 'DELETE' })
      void fetchCart()
    } catch (err) {
      toast.error(t('common.deleteError', { defaultValue: 'Delete failed' }))
    }
  }

  const handleCheckout = async () => {
    if (!token || !cart) return
    setCheckingOut(true)
    try {
      const data = await api<{ session_url: string }>('/checkout/session', {
        method: 'POST',
        body: JSON.stringify({ order_id: cart.order_id }),
      })
      window.location.href = data.session_url
    } catch (err) {
      toast.error(t('common.fetchError'))
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

  const columns = useMemo<ColumnDef<CartItem, unknown>[]>(
    () => [
      {
        accessorKey: 'plan_name',
        header: () => t('cart.plan'),
        cell: ({ row }) => (
          <div>
            <div className="text-text font-medium">{row.original.plan_name}</div>
            {row.original.specs && <div className="text-xs text-text-secondary">{row.original.specs}</div>}
          </div>
        ),
      },
      {
        accessorKey: 'billing_cycle',
        header: () => t('cart.billingCycle'),
        cell: ({ row }) => (
          <span className="text-text-secondary">
            {t(`cart.cycle_${row.original.billing_cycle}`, { defaultValue: row.original.billing_cycle })}
          </span>
        ),
      },
      {
        accessorKey: 'quantity',
        header: () => t('cart.quantity'),
        cell: ({ row }) => <span className="text-text">{row.original.quantity}</span>,
      },
      {
        accessorKey: 'unit_price',
        header: () => t('cart.unitPrice'),
        cell: ({ row }) => <span className="text-text">{t('common.currency')}{row.original.unit_price}</span>,
      },
      {
        id: 'subtotal',
        header: () => t('cart.subtotal'),
        cell: ({ row }) => (
          <span className="text-text font-medium">
            {t('common.currency')}{(row.original.quantity * row.original.unit_price).toFixed(2)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => t('common.actions'),
        cell: ({ row }) => (
          <button
            className="text-red-500 hover:text-red-400"
            onClick={() => void handleRemoveItem(row.original.id)}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        ),
      },
    ],
    [t],
  )

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
            <DataTable
              columns={columns}
              data={items}
              emptyText={t('cart.empty')}
            />
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
