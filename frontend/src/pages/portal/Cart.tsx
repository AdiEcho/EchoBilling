import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingCart, Trash2, CreditCard, Minus, Plus } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import DataTable from '../../components/ui/DataTable'
import { SkeletonTable } from '../../components/ui/Skeleton'
import { useAuthStore } from '../../stores/auth'
import { api } from '../../lib/utils'
import { toast } from '../../stores/toast'
import { useTranslation } from 'react-i18next'
import type { ColumnDef } from '@tanstack/react-table'

interface PlanSnapshot {
  name?: string
  cpu_cores?: number
  memory_mb?: number
  disk_gb?: number
  bandwidth_tb?: string
}

interface CartItem {
  id: string
  plan_id: string
  plan_snapshot: PlanSnapshot
  quantity: number
  unit_price: string
  billing_cycle: string
}

interface CartData {
  id: string
  items: CartItem[]
  total_amount: string
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

  const handleUpdateQuantity = async (itemId: string, quantity: number) => {
    if (!token || quantity < 1) return
    try {
      const data = await api<CartData>(`/cart/items/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity }),
      })
      setCart(data)
    } catch (err) {
      toast.error(t('common.fetchError'))
    }
  }

  const handleCheckout = async () => {
    if (!token || !cart) return
    setCheckingOut(true)
    try {
      const data = await api<{ session_url: string }>('/checkout/session', {
        method: 'POST',
        body: JSON.stringify({ order_id: cart.id }),
      })
      window.location.href = data.session_url
    } catch (err) {
      toast.error(t('common.fetchError'))
      setCheckingOut(false)
    }
  }

  const items = cart?.items ?? []

  const columns = useMemo<ColumnDef<CartItem, unknown>[]>(
    () => [
      {
        accessorKey: 'plan_snapshot',
        header: () => t('cart.plan'),
        cell: ({ row }) => {
          const snapshot = row.original.plan_snapshot
          const specs = [
            snapshot?.cpu_cores && `${snapshot.cpu_cores} vCPU`,
            snapshot?.memory_mb && `${snapshot.memory_mb} MB`,
            snapshot?.disk_gb && `${snapshot.disk_gb} GB`,
          ].filter(Boolean).join(' / ')
          return (
            <div>
              <div className="text-text font-medium">{snapshot?.name ?? '-'}</div>
              {specs && <div className="text-xs text-text-secondary">{specs}</div>}
            </div>
          )
        },
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
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <button
              className="w-7 h-7 flex items-center justify-center rounded-md border border-border hover:bg-surface-hover text-text disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => void handleUpdateQuantity(row.original.id, row.original.quantity - 1)}
              disabled={row.original.quantity <= 1}
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-text w-8 text-center">{row.original.quantity}</span>
            <button
              className="w-7 h-7 flex items-center justify-center rounded-md border border-border hover:bg-surface-hover text-text"
              onClick={() => void handleUpdateQuantity(row.original.id, row.original.quantity + 1)}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        ),
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
            {t('common.currency')}{(row.original.quantity * parseFloat(row.original.unit_price)).toFixed(2)}
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

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-text">{t('cart.title')}</h1>
        <Card><SkeletonTable rows={3} cols={5} /></Card>
      </div>
    )
  }

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
                <p className="text-3xl font-bold text-text">{t('common.currency')}{cart?.total_amount}</p>
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
