import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import { SkeletonTable } from '../../components/ui/Skeleton'
import { api } from '../../lib/utils'
import { useAuthStore } from '../../stores/auth'
import { useTranslation } from 'react-i18next'

interface Plan {
  id: string
  name: string
  cpu_cores: number
  memory_mb: number
  disk_gb: number
  bandwidth_tb: number
  price_monthly: number
  price_quarterly: number
  price_annually: number
  features: string[]
}

interface Product {
  id: string
  name: string
  slug: string
  category: string
  description: string
  status: 'active' | 'inactive'
  plans_count: number
}

const emptyProduct = { name: '', slug: '', category: '', description: '' }
const emptyPlan = {
  name: '',
  cpu_cores: 1,
  memory_mb: 1024,
  disk_gb: 25,
  bandwidth_tb: 1,
  price_monthly: 0,
  price_quarterly: 0,
  price_annually: 0,
  features: '' as string,
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState(emptyProduct)

  // Plan management
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [plansLoading, setPlansLoading] = useState(false)
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [planForm, setPlanForm] = useState(emptyPlan)
  const [planProductId, setPlanProductId] = useState<string>('')

  const token = useAuthStore((state) => state.token)
  const { t } = useTranslation()

  const fetchProducts = async () => {
    try {
      const data = await api<Product[]>('/products')
      setProducts(data)
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchProducts()
  }, [])

  const fetchPlans = async (productId: string) => {
    setPlansLoading(true)
    try {
      const data = await api<Plan[]>(`/products/${productId}/plans`)
      setPlans(data)
    } catch (error) {
      console.error('Failed to fetch plans:', error)
    } finally {
      setPlansLoading(false)
    }
  }

  const handleTogglePlans = (productId: string) => {
    if (expandedProduct === productId) {
      setExpandedProduct(null)
      setPlans([])
    } else {
      setExpandedProduct(productId)
      void fetchPlans(productId)
    }
  }

  // Product CRUD
  const openCreateProduct = () => {
    setEditingProduct(null)
    setFormData(emptyProduct)
    setShowProductModal(true)
  }

  const openEditProduct = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      slug: product.slug,
      category: product.category,
      description: product.description || '',
    })
    setShowProductModal(true)
  }

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    try {
      if (editingProduct) {
        await api(`/admin/products/${editingProduct.id}`, {
          method: 'PUT',
          token,
          body: JSON.stringify(formData),
        })
      } else {
        await api('/admin/products', {
          method: 'POST',
          token,
          body: JSON.stringify(formData),
        })
      }
      setShowProductModal(false)
      setLoading(true)
      void fetchProducts()
    } catch (error) {
      console.error('Failed to save product:', error)
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!token || !confirm(t('admin.products.confirmDelete'))) return
    try {
      await api(`/admin/products/${productId}`, { method: 'DELETE', token })
      setLoading(true)
      void fetchProducts()
    } catch (error) {
      console.error('Failed to delete product:', error)
    }
  }

  // Plan CRUD
  const openCreatePlan = (productId: string) => {
    setEditingPlan(null)
    setPlanProductId(productId)
    setPlanForm(emptyPlan)
    setShowPlanModal(true)
  }

  const openEditPlan = (plan: Plan, productId: string) => {
    setEditingPlan(plan)
    setPlanProductId(productId)
    setPlanForm({
      name: plan.name,
      cpu_cores: plan.cpu_cores,
      memory_mb: plan.memory_mb,
      disk_gb: plan.disk_gb,
      bandwidth_tb: plan.bandwidth_tb,
      price_monthly: plan.price_monthly,
      price_quarterly: plan.price_quarterly,
      price_annually: plan.price_annually,
      features: plan.features?.join(', ') ?? '',
    })
    setShowPlanModal(true)
  }

  const handlePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    const body = {
      ...planForm,
      product_id: planProductId,
      features: typeof planForm.features === 'string'
        ? planForm.features.split(',').map((f) => f.trim()).filter(Boolean)
        : planForm.features,
    }
    try {
      if (editingPlan) {
        await api(`/admin/plans/${editingPlan.id}`, {
          method: 'PUT',
          token,
          body: JSON.stringify(body),
        })
      } else {
        await api('/admin/plans', {
          method: 'POST',
          token,
          body: JSON.stringify(body),
        })
      }
      setShowPlanModal(false)
      void fetchPlans(planProductId)
      // Refresh products to update plans_count
      void fetchProducts()
    } catch (error) {
      console.error('Failed to save plan:', error)
    }
  }

  const handleDeletePlan = async (planId: string) => {
    if (!token || !confirm(t('admin.products.confirmDeletePlan'))) return
    try {
      await api(`/admin/plans/${planId}`, { method: 'DELETE', token })
      if (expandedProduct) void fetchPlans(expandedProduct)
      void fetchProducts()
    } catch (error) {
      console.error('Failed to delete plan:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-text">{t('admin.products.title')}</h1>
        <Button onClick={openCreateProduct}>
          <Plus className="w-4 h-4 mr-2" />
          {t('admin.products.addProduct')}
        </Button>
      </div>

      <Card>
        {loading ? (
          <SkeletonTable rows={5} cols={6} />
        ) : products.length === 0 ? (
          <div className="text-text-secondary p-4">{t('admin.products.noProducts')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">{t('common.name')}</th>
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">{t('admin.products.slug')}</th>
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">{t('common.category')}</th>
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">{t('admin.products.status')}</th>
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">{t('admin.products.plans')}</th>
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <>
                    <tr
                      key={product.id}
                      className="border-b border-border hover:bg-surface/50 transition-colors"
                    >
                      <td className="py-3 px-4 text-text">{product.name}</td>
                      <td className="py-3 px-4 text-text-secondary">{product.slug}</td>
                      <td className="py-3 px-4 text-text-secondary">{product.category}</td>
                      <td className="py-3 px-4">
                        <Badge variant={product.status === 'active' ? 'success' : 'default'}>
                          {t(`status.${product.status}`, { defaultValue: product.status })}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleTogglePlans(product.id)}
                          className="flex items-center gap-1 text-primary hover:text-primary/80"
                        >
                          {product.plans_count}
                          {expandedProduct === product.id ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            className="text-primary hover:text-primary/80"
                            aria-label={t('common.edit')}
                            onClick={() => openEditProduct(product)}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            className="text-red-500 hover:text-red-400"
                            aria-label={t('common.delete')}
                            onClick={() => void handleDeleteProduct(product.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedProduct === product.id && (
                      <tr key={`${product.id}-plans`}>
                        <td colSpan={6} className="bg-surface/30 px-8 py-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-medium text-text">{t('admin.products.plansFor', { name: product.name })}</h3>
                            <Button size="sm" onClick={() => openCreatePlan(product.id)}>
                              <Plus className="w-3 h-3 mr-1" />
                              {t('admin.products.addPlan')}
                            </Button>
                          </div>
                          {plansLoading ? (
                            <SkeletonTable rows={2} cols={5} />
                          ) : plans.length === 0 ? (
                            <p className="text-text-secondary text-sm">{t('admin.products.noPlans')}</p>
                          ) : (
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-border">
                                  <th className="text-left py-2 px-3 text-text-secondary font-medium">{t('common.name')}</th>
                                  <th className="text-left py-2 px-3 text-text-secondary font-medium">{t('common.cpu')}</th>
                                  <th className="text-left py-2 px-3 text-text-secondary font-medium">{t('common.ram')}</th>
                                  <th className="text-left py-2 px-3 text-text-secondary font-medium">{t('common.storage')}</th>
                                  <th className="text-left py-2 px-3 text-text-secondary font-medium">{t('admin.products.monthlyPrice')}</th>
                                  <th className="text-left py-2 px-3 text-text-secondary font-medium">{t('common.actions')}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {plans.map((plan) => (
                                  <tr key={plan.id} className="border-b border-border/50">
                                    <td className="py-2 px-3 text-text">{plan.name}</td>
                                    <td className="py-2 px-3 text-text-secondary">{plan.cpu_cores} vCPU</td>
                                    <td className="py-2 px-3 text-text-secondary">{plan.memory_mb >= 1024 ? `${plan.memory_mb / 1024}GB` : `${plan.memory_mb}MB`}</td>
                                    <td className="py-2 px-3 text-text-secondary">{plan.disk_gb}GB</td>
                                    <td className="py-2 px-3 text-text">${plan.price_monthly}</td>
                                    <td className="py-2 px-3">
                                      <div className="flex gap-2">
                                        <button
                                          className="text-primary hover:text-primary/80"
                                          onClick={() => openEditPlan(plan, product.id)}
                                        >
                                          <Edit className="w-3 h-3" />
                                        </button>
                                        <button
                                          className="text-red-500 hover:text-red-400"
                                          onClick={() => void handleDeletePlan(plan.id)}
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Product Modal */}
      <Modal
        open={showProductModal}
        onClose={() => setShowProductModal(false)}
        title={editingProduct ? t('admin.products.editProduct') : t('admin.products.modalTitle')}
      >
        <form onSubmit={(e) => void handleProductSubmit(e)} className="space-y-4">
          <Input
            label={t('common.name')}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label={t('admin.products.slug')}
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            required
          />
          <Input
            label={t('common.category')}
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            required
          />
          <Input
            label={t('common.description')}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setShowProductModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit">{editingProduct ? t('common.save') : t('common.create')}</Button>
          </div>
        </form>
      </Modal>

      {/* Plan Modal */}
      <Modal
        open={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        title={editingPlan ? t('admin.products.editPlan') : t('admin.products.addPlan')}
      >
        <form onSubmit={(e) => void handlePlanSubmit(e)} className="space-y-4">
          <Input
            label={t('common.name')}
            value={planForm.name}
            onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t('common.cpu')}
              type="number"
              value={planForm.cpu_cores}
              onChange={(e) => setPlanForm({ ...planForm, cpu_cores: Number(e.target.value) })}
              required
            />
            <Input
              label={`${t('common.ram')} (MB)`}
              type="number"
              value={planForm.memory_mb}
              onChange={(e) => setPlanForm({ ...planForm, memory_mb: Number(e.target.value) })}
              required
            />
            <Input
              label={`${t('common.storage')} (GB)`}
              type="number"
              value={planForm.disk_gb}
              onChange={(e) => setPlanForm({ ...planForm, disk_gb: Number(e.target.value) })}
              required
            />
            <Input
              label={`${t('common.bandwidth')} (TB)`}
              type="number"
              value={planForm.bandwidth_tb}
              onChange={(e) => setPlanForm({ ...planForm, bandwidth_tb: Number(e.target.value) })}
              required
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input
              label={t('admin.products.monthlyPrice')}
              type="number"
              step="0.01"
              value={planForm.price_monthly}
              onChange={(e) => setPlanForm({ ...planForm, price_monthly: Number(e.target.value) })}
              required
            />
            <Input
              label={t('admin.products.quarterlyPrice')}
              type="number"
              step="0.01"
              value={planForm.price_quarterly}
              onChange={(e) => setPlanForm({ ...planForm, price_quarterly: Number(e.target.value) })}
            />
            <Input
              label={t('admin.products.annuallyPrice')}
              type="number"
              step="0.01"
              value={planForm.price_annually}
              onChange={(e) => setPlanForm({ ...planForm, price_annually: Number(e.target.value) })}
            />
          </div>
          <Input
            label={t('admin.products.featuresComma')}
            value={planForm.features}
            onChange={(e) => setPlanForm({ ...planForm, features: e.target.value })}
          />
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setShowPlanModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit">{editingPlan ? t('common.save') : t('common.create')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
