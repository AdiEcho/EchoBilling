import { Link } from 'react-router-dom'
import { HardDrive, Wifi, Shield, Clock, Globe, Headphones } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'

export default function Home() {
  const features = [
    {
      icon: HardDrive,
      title: 'NVMe SSD Storage',
      description: 'Lightning-fast NVMe SSDs for superior performance and reliability',
    },
    {
      icon: Wifi,
      title: '10Gbps Network',
      description: 'High-speed network connectivity for seamless data transfer',
    },
    {
      icon: Shield,
      title: 'DDoS Protection',
      description: 'Enterprise-grade protection against distributed attacks',
    },
    {
      icon: Clock,
      title: '99.99% Uptime',
      description: 'Industry-leading uptime guarantee for your critical workloads',
    },
    {
      icon: Globe,
      title: 'Global Locations',
      description: 'Deploy servers in multiple regions worldwide',
    },
    {
      icon: Headphones,
      title: '24/7 Support',
      description: 'Expert support team available around the clock',
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-bg via-surface/20 to-bg py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold text-text mb-6">
            Cloud Infrastructure Built for{' '}
            <span className="text-primary">Performance</span>
          </h1>
          <p className="text-xl md:text-2xl text-text-secondary max-w-3xl mx-auto mb-10">
            Premium VPS hosting powered by cutting-edge technology. Deploy your applications
            with confidence on our high-performance infrastructure.
          </p>
          <Link to="/pricing">
            <Button variant="cta" size="lg" className="text-lg px-8 py-4">
              Get Started
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section className="py-20 px-4 bg-bg">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-text text-center mb-12">
            Everything You Need to Succeed
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <Card key={feature.title} hover className="group">
                  <div className="flex flex-col items-start">
                    <div className="p-3 rounded-lg bg-primary/10 text-primary mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-heading text-xl font-semibold text-text mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-text-secondary">{feature.description}</p>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-bg to-surface/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-text mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-text-secondary mb-8">
            Choose a plan that fits your needs and deploy in minutes
          </p>
          <Link to="/pricing">
            <Button variant="cta" size="lg" className="text-lg px-8 py-4">
              View Pricing
            </Button>
          </Link>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 px-4 bg-surface/50">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-text-secondary text-lg">
            Trusted by developers worldwide
          </p>
        </div>
      </section>
    </div>
  )
}
