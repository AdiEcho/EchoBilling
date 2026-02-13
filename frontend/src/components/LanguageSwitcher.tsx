import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'

export default function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { i18n, t } = useTranslation()
  const isZh = i18n.resolvedLanguage?.startsWith('zh')

  const toggle = () => {
    const next = isZh ? 'en' : 'zh'
    void i18n.changeLanguage(next)
  }

  return (
    <button
      onClick={toggle}
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-text-secondary hover:text-text hover:bg-surface-hover transition-colors ${className}`}
      aria-label={t('languageSwitcher.ariaLabel')}
    >
      <Globe size={16} />
      <span>{isZh ? t('languageSwitcher.switchToEnglish') : t('languageSwitcher.switchToChinese')}</span>
    </button>
  )
}
