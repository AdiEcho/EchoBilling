import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/utils'
import Button from './Button'

interface EmptyStateProps {
  icon?: LucideIcon
  message: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export default function EmptyState({ icon: Icon, message, action, className }: EmptyStateProps) {
  return (
    <div className={cn('text-center py-12', className)}>
      {Icon && <Icon className="w-12 h-12 text-text-muted mx-auto mb-4" />}
      <p className="text-text-secondary">{message}</p>
      {action && (
        <Button variant="outline" size="sm" className="mt-4" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
