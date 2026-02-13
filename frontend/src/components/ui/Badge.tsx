import { cn } from '../../lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  className?: string
}

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        {
          'bg-surface-hover text-text-secondary': variant === 'default',
          'bg-cta/20 text-cta': variant === 'success',
          'bg-warning/20 text-warning': variant === 'warning',
          'bg-danger/20 text-danger': variant === 'danger',
          'bg-primary/20 text-primary': variant === 'info',
        },
        className
      )}
    >
      {children}
    </span>
  )
}
