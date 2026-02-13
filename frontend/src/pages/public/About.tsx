import { Building2, Target, Users, Award } from 'lucide-react'
import Card from '../../components/ui/Card'

export default function About() {
  const values = [
    {
      icon: Target,
      title: 'Our Mission',
      description:
        'To provide developers and businesses with reliable, high-performance cloud infrastructure that scales with their needs.',
    },
    {
      icon: Users,
      title: 'Customer First',
      description:
        'We prioritize customer satisfaction with 24/7 support and transparent communication.',
    },
    {
      icon: Award,
      title: 'Quality Standards',
      description:
        'Enterprise-grade infrastructure with industry-leading uptime and security standards.',
    },
  ]

  return (
    <div className="min-h-screen py-20 px-4 bg-bg">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-text mb-4">
            About EchoBilling
          </h1>
          <p className="text-xl text-text-secondary">
            Building the future of cloud infrastructure
          </p>
        </div>

        <Card className="mb-12">
          <div className="flex items-start space-x-4">
            <div className="p-3 rounded-lg bg-primary/10 text-primary">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="font-heading text-2xl font-bold text-text mb-3">
                EchoBilling LLC
              </h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                EchoBilling is a leading provider of cloud infrastructure solutions, specializing
                in high-performance VPS hosting. Founded with a vision to democratize access to
                enterprise-grade infrastructure, we serve developers, startups, and businesses
                worldwide.
              </p>
              <p className="text-text-secondary leading-relaxed">
                Our state-of-the-art data centers and cutting-edge technology ensure that your
                applications run smoothly, securely, and efficiently. We believe in transparent
                pricing, exceptional support, and empowering our customers to build amazing things.
              </p>
            </div>
          </div>
        </Card>

        <div className="mb-12">
          <h2 className="font-heading text-3xl font-bold text-text mb-8 text-center">
            Our Values
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {values.map((value) => {
              const Icon = value.icon
              return (
                <Card key={value.title} hover>
                  <div className="text-center">
                    <div className="inline-flex p-3 rounded-lg bg-primary/10 text-primary mb-4">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-heading text-xl font-semibold text-text mb-2">
                      {value.title}
                    </h3>
                    <p className="text-text-secondary text-sm">{value.description}</p>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>

        <Card className="bg-surface/50">
          <h2 className="font-heading text-2xl font-bold text-text mb-4">
            Company Information
          </h2>
          <div className="space-y-2 text-text-secondary">
            <p>
              <span className="font-medium text-text">Legal Entity:</span> EchoBilling LLC
            </p>
            <p>
              <span className="font-medium text-text">Registration:</span> Delaware, United States
            </p>
            <p>
              <span className="font-medium text-text">Founded:</span> 2024
            </p>
            <p className="text-sm text-text-muted mt-4">
              EchoBilling LLC is a registered limited liability company operating in compliance
              with all applicable federal and state regulations.
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
