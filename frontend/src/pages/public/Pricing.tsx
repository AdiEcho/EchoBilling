import { Check } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'

export default function Pricing() {
  const plans = [
    {
      name: 'Starter',
      price: 5,
      popular: false,
      specs: {
        cpu: '1 vCPU',
        ram: '1GB RAM',
        storage: '25GB NVMe SSD',
        bandwidth: '1TB Bandwidth',
      },
      features: [
        'Full Root Access',
        'DDoS Protection',
        '99.9% Uptime SLA',
        'IPv4 & IPv6',
      ],
    },
    {
      name: 'Pro',
      price: 20,
      popular: true,
      specs: {
        cpu: '2 vCPU',
        ram: '4GB RAM',
        storage: '80GB NVMe SSD',
        bandwidth: '4TB Bandwidth',
      },
      features: [
        'Full Root Access',
        'DDoS Protection',
        '99.99% Uptime SLA',
        'IPv4 & IPv6',
        'Priority Support',
        'Free Backups',
      ],
    },
    {
      name: 'Business',
      price: 40,
      popular: false,
      specs: {
        cpu: '4 vCPU',
        ram: '8GB RAM',
        storage: '160GB NVMe SSD',
        bandwidth: '5TB Bandwidth',
      },
      features: [
        'Full Root Access',
        'DDoS Protection',
        '99.99% Uptime SLA',
        'IPv4 & IPv6',
        'Priority Support',
        'Free Backups',
        'Dedicated IP',
      ],
    },
    {
      name: 'Enterprise',
      price: 80,
      popular: false,
      specs: {
        cpu: '8 vCPU',
        ram: '16GB RAM',
        storage: '320GB NVMe SSD',
        bandwidth: '10TB Bandwidth',
      },
      features: [
        'Full Root Access',
        'DDoS Protection',
        '99.99% Uptime SLA',
        'IPv4 & IPv6',
        'Priority Support',
        'Free Backups',
        'Dedicated IP',
        'Custom Solutions',
      ],
    },
  ]

  return (
    <div className="min-h-screen py-20 px-4 bg-bg">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-text mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-text-secondary">
            Choose the perfect plan for your needs. All plans include our core features.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              hover
              className={`relative flex flex-col ${
                plan.popular ? 'border-primary shadow-lg shadow-primary/20' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="info" className="px-3 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}

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
                    <span>{plan.specs.cpu}</span>
                  </div>
                  <div className="flex items-center text-text-secondary">
                    <Check className="w-4 h-4 text-cta mr-2 flex-shrink-0" />
                    <span>{plan.specs.ram}</span>
                  </div>
                  <div className="flex items-center text-text-secondary">
                    <Check className="w-4 h-4 text-cta mr-2 flex-shrink-0" />
                    <span>{plan.specs.storage}</span>
                  </div>
                  <div className="flex items-center text-text-secondary">
                    <Check className="w-4 h-4 text-cta mr-2 flex-shrink-0" />
                    <span>{plan.specs.bandwidth}</span>
                  </div>
                </div>

                <div className="border-t border-border pt-4 mb-6">
                  <p className="text-sm font-medium text-text mb-3">Included Features:</p>
                  <div className="space-y-2">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-center text-sm text-text-secondary">
                        <Check className="w-4 h-4 text-cta mr-2 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Button
                variant={plan.popular ? 'cta' : 'primary'}
                className="w-full"
              >
                Get Started
              </Button>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-text-secondary">
            All prices in USD. Billed monthly. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  )
}
