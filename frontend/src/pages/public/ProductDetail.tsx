import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Check, Loader2 } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { api } from '../../lib/utils'

interface ProductPlan {
  id: string
  name: string
  price: number
  cpu: string
  ram: string
  storage: string
  bandwidth: string
  features: string[]
}

interface Product {
  id: string
  name: string
  slug: string
  description: string
  category: string
  plans: ProductPlan[]
}

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await api<Product>(`/products/${slug}`)
        setProduct(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product')
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      fetchProduct()
    }
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen py-20 px-4 bg-bg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Loading product details...</p>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen py-20 px-4 bg-bg flex items-center justify-center">
        <Card className="max-w-md text-center">
          <h2 className="font-heading text-2xl font-bold text-text mb-2">
            Product Not Found
          </h2>
          <p className="text-text-secondary mb-4">
            {error || 'The product you are looking for does not exist.'}
          </p>
          <Button variant="primary" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-20 px-4 bg-bg">
      <div className="max-w-7xl mx-auto">
        {/* Product Header */}
        <div className="text-center mb-16">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-text mb-4">
            {product.name}
          </h1>
          <p className="text-xl text-text-secondary max-w-3xl mx-auto">
            {product.description}
          </p>
        </div>

        {/* Plans Comparison */}
        <div className="mb-12">
          <h2 className="font-heading text-3xl font-bold text-text text-center mb-8">
            Choose Your Plan
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {product.plans.map((plan) => (
              <Card key={plan.id} hover className="flex flex-col">
                <div className="flex-1">
                  <h3 className="font-heading text-2xl font-bold text-text mb-2">
                    {plan.name}
                  </h3>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-text">${plan.price}</span>
                    <span className="text-text-secondary">/month</span>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-text-secondary">
                      <Check className="w-4 h-4 text-cta mr-2 flex-shrink-0" />
                      <span>{plan.cpu}</span>
                    </div>
                    <div className="flex items-center text-text-secondary">
                      <Check className="w-4 h-4 text-cta mr-2 flex-shrink-0" />
                      <span>{plan.ram}</span>
                    </div>
                    <div className="flex items-center text-text-secondary">
                      <Check className="w-4 h-4 text-cta mr-2 flex-shrink-0" />
                      <span>{plan.storage}</span>
                    </div>
                    <div className="flex items-center text-text-secondary">
                      <Check className="w-4 h-4 text-cta mr-2 flex-shrink-0" />
                      <span>{plan.bandwidth}</span>
                    </div>
                  </div>

                  {plan.features && plan.features.length > 0 && (
                    <div className="border-t border-border pt-4 mb-6">
                      <p className="text-sm font-medium text-text mb-3">Features:</p>
                      <div className="space-y-2">
                        {plan.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center text-sm text-text-secondary">
                            <Check className="w-4 h-4 text-cta mr-2 flex-shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <Button variant="cta" className="w-full">
                  Order Now
                </Button>
              </Card>
            ))}
          </div>
        </div>

        {/* Detailed Comparison Table */}
        <Card>
          <h2 className="font-heading text-2xl font-bold text-text mb-6">
            Detailed Comparison
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-text font-medium">Feature</th>
                  {product.plans.map((plan) => (
                    <th key={plan.id} className="text-center py-3 px-4 text-text font-medium">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="py-3 px-4 text-text-secondary">CPU</td>
                  {product.plans.map((plan) => (
                    <td key={plan.id} className="text-center py-3 px-4 text-text">
                      {plan.cpu}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4 text-text-secondary">RAM</td>
                  {product.plans.map((plan) => (
                    <td key={plan.id} className="text-center py-3 px-4 text-text">
                      {plan.ram}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4 text-text-secondary">Storage</td>
                  {product.plans.map((plan) => (
                    <td key={plan.id} className="text-center py-3 px-4 text-text">
                      {plan.storage}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4 text-text-secondary">Bandwidth</td>
                  {product.plans.map((plan) => (
                    <td key={plan.id} className="text-center py-3 px-4 text-text">
                      {plan.bandwidth}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 text-text-secondary">Monthly Price</td>
                  {product.plans.map((plan) => (
                    <td key={plan.id} className="text-center py-3 px-4 text-text font-bold">
                      ${plan.price}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
