import { useToastStore } from '../../stores/toast'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { cn } from '../../lib/utils'

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

const colorMap = {
  success: 'border-cta/50 bg-cta/10 text-cta',
  error: 'border-danger/50 bg-danger/10 text-danger',
  warning: 'border-warning/50 bg-warning/10 text-warning',
  info: 'border-primary/50 bg-primary/10 text-primary',
}

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => {
        const Icon = iconMap[t.type]
        return (
          <div
            key={t.id}
            className={cn(
              'flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg backdrop-blur-sm animate-in slide-in-from-right',
              colorMap[t.type],
            )}
          >
            <Icon className="w-5 h-5 mt-0.5 shrink-0" />
            <p className="text-sm text-text flex-1">{t.message}</p>
            <button
              onClick={() => removeToast(t.id)}
              className="text-text-secondary hover:text-text transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
