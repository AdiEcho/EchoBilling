import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2 } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Input from '../../components/ui/Input'
import { api } from '../../lib/utils'

interface Product {
  id: string
  name: string
  slug: string
  category: string
  status: 'active' | 'inactive'
  plans_count: number
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    category: '',
    description: '',
  })

  useEffect(() => {
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
    fetchProducts()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Create product:', formData)
    setShowModal(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-text">Products Management</h1>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      <Card>
        {loading ? (
          <div className="text-text-secondary p-4">Loading...</div>
        ) : products.length === 0 ? (
          <div className="text-text-secondary p-4">No products found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">Name</th>
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">Slug</th>
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">Category</th>
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">Plans</th>
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-border hover:bg-surface/50 transition-colors"
                  >
                    <td className="py-3 px-4 text-text">{product.name}</td>
                    <td className="py-3 px-4 text-text-secondary">{product.slug}</td>
                    <td className="py-3 px-4 text-text-secondary">{product.category}</td>
                    <td className="py-3 px-4">
                      <Badge variant={product.status === 'active' ? 'success' : 'default'}>
                        {product.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-text-secondary">{product.plans_count}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button className="text-primary hover:text-primary/80">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="text-red-500 hover:text-red-400">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-xl font-bold text-text">Add Product</h2>
              <Input
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <Input
                label="Slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                required
              />
              <Input
                label="Category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              />
              <Input
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
