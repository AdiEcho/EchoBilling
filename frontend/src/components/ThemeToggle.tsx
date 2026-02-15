import { Sun, Moon } from 'lucide-react'
import { useThemeStore } from '../stores/theme'

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, resolvedTheme, toggleTheme } = useThemeStore()

  const displayTheme = theme === 'system' ? resolvedTheme : theme
  const Icon = displayTheme === 'light' ? Sun : Moon
  const label = displayTheme === 'light' ? 'Light' : 'Dark'

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
