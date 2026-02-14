import { Sun, Moon, Monitor } from 'lucide-react'
import { useThemeStore } from '../stores/theme'

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useThemeStore()

  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor
  const label = theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'System'

  return (
    <button
      onClick={toggleTheme}
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-text-secondary hover:text-text hover:bg-surface-hover transition-colors ${className}`}
      aria-label={`Theme: ${label}`}
    >
      <Icon size={16} />
      <span>{label}</span>
    </button>
  )
}
