import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { CreditCard, Shield } from 'lucide-react'

export default function BillingMethods() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text">支付方式</h1>
        <p className="text-text-secondary mt-2">管理您的支付方式</p>
      </div>

      <Card>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-text mb-2">Stripe 支付</h2>
            <p className="text-text-secondary text-sm mb-4">
              我们使用 Stripe 处理所有支付。Stripe 是一个安全、可靠的支付平台，支持多种支付方式。
            </p>
            <Button variant="primary">
              管理支付方式
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-cta/10 flex items-center justify-center flex-shrink-0">
            <Shield className="w-6 h-6 text-cta" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-text mb-2">PCI 合规</h2>
            <p className="text-text-secondary text-sm">
              您的支付信息由 Stripe 安全存储和处理。我们不会在服务器上存储您的信用卡信息，确保最高级别的安全性。
            </p>
          </div>
        </div>
      </Card>

      <Card className="bg-surface/50">
        <h3 className="text-sm font-medium text-text mb-2">支持的支付方式</h3>
        <div className="flex flex-wrap gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-surface border border-border text-xs text-text-secondary">
            信用卡
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-surface border border-border text-xs text-text-secondary">
            借记卡
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-surface border border-border text-xs text-text-secondary">
            支付宝
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-surface border border-border text-xs text-text-secondary">
            微信支付
          </div>
        </div>
      </Card>
    </div>
  )
}
