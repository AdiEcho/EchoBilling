import type { LucideIcon } from 'lucide-react'
import Card from './Card'
import { cn } from '../../lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  iconColor: string
  iconBg: string
  className?: string
}

export default function StatCard({ title, value, icon: Icon, iconColor, iconBg, className }: StatCardProps) {
  return (
    <Card className={className}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-text-secondary">{title}</p>
          <p className="text-2xl font-bold text-text mt-1">{value}</p>
        </div>
        <div className={cn('w-12 h-12 rounded-full flex items-center justify-center', iconBg)}>
          <Icon className={cn('w-6 h-6', iconColor)} />
        </div>
      </div>
    </Card>
  )
}
