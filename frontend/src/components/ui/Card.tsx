import { cn } from '../../lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
}

export default function Card({ children, className, hover }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-surface/80 backdrop-blur-sm p-6',
        hover && 'transition-all duration-150 hover:scale-[1.02] hover:border-primary/50',
        className
      )}
    >
      {children}
    </div>
  )
}
