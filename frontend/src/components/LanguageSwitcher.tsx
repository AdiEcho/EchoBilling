import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'

export default function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { i18n } = useTranslation()

  const toggle = () => {
    const next = i18n.language === 'zh' ? 'en' : 'zh'
    i18n.changeLanguage(next)
  }

  return (
    <button
      onClick={toggle}
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-text-secondary hover:text-text hover:bg-surface-hover transition-colors ${className}`}
      aria-label="Switch language"
    >
      <Globe size={16} />
      <span>{i18n.language === 'zh' ? 'EN' : '中文'}</span>
    </button>
  )
}
