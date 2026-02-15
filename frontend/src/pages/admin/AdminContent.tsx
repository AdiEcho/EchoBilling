import { useState, useEffect } from 'react'
import { Save, RotateCcw } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { api } from '../../lib/utils'
import { toast } from '../../stores/toast'
import { useTranslation } from 'react-i18next'

interface PageContentResponse {
  page_key: string
  locale: string
  sections: Record<string, string>
}

interface FieldDef {
  key: string
  label: string
  multiline?: boolean
}

const aboutFields: FieldDef[] = [
  { key: 'title', label: 'sectionTitle' },
  { key: 'subtitle', label: 'sectionSubtitle' },
  { key: 'company.title', label: 'companyTitle' },
  { key: 'company.paragraph1', label: 'companyParagraph1', multiline: true },
  { key: 'company.paragraph2', label: 'companyParagraph2', multiline: true },
  { key: 'values.mission.title', label: 'missionTitle' },
  { key: 'values.mission.description', label: 'missionDescription', multiline: true },
  { key: 'values.customer.title', label: 'customerTitle' },
  { key: 'values.customer.description', label: 'customerDescription', multiline: true },
  { key: 'values.quality.title', label: 'qualityTitle' },
  { key: 'values.quality.description', label: 'qualityDescription', multiline: true },
  { key: 'companyInfoTitle', label: 'companyInfoTitle' },
  { key: 'companyInfo.legalEntity', label: 'legalEntity' },
  { key: 'companyInfo.registration', label: 'registration' },
  { key: 'companyInfo.founded', label: 'founded' },
  { key: 'companyInfo.registrationValue', label: 'registrationValue' },
  { key: 'companyInfo.foundedValue', label: 'foundedValue' },
  { key: 'companyInfo.note', label: 'companyInfoNote', multiline: true },
]

const contactFields: FieldDef[] = [
  { key: 'title', label: 'sectionTitle' },
  { key: 'subtitle', label: 'sectionSubtitle' },
  { key: 'info.email', label: 'emailLabel' },
  { key: 'info.emailValue', label: 'emailValue' },
  { key: 'info.businessHours', label: 'businessHoursLabel' },
  { key: 'info.support247', label: 'support247' },
  { key: 'info.responseTime', label: 'responseTime' },
  { key: 'info.address', label: 'addressLabel' },
  { key: 'info.addressValue', label: 'addressValue' },
  { key: 'urgent.title', label: 'urgentTitle' },
  { key: 'urgent.description', label: 'urgentDescription', multiline: true },
  { key: 'urgent.button', label: 'urgentButton' },
]

// Map i18n keys to section keys for default value lookup
const aboutI18nMap: Record<string, string> = {
  'title': 'about.title',
  'subtitle': 'about.subtitle',
  'company.title': 'about.company.title',
  'company.paragraph1': 'about.company.paragraph1',
  'company.paragraph2': 'about.company.paragraph2',
  'values.mission.title': 'about.values.mission.title',
  'values.mission.description': 'about.values.mission.description',
  'values.customer.title': 'about.values.customer.title',
  'values.customer.description': 'about.values.customer.description',
  'values.quality.title': 'about.values.quality.title',
  'values.quality.description': 'about.values.quality.description',
  'companyInfoTitle': 'about.companyInfoTitle',
  'companyInfo.legalEntity': 'about.companyInfo.legalEntity',
  'companyInfo.registration': 'about.companyInfo.registration',
  'companyInfo.founded': 'about.companyInfo.founded',
  'companyInfo.registrationValue': 'about.companyInfo.registrationValue',
  'companyInfo.foundedValue': 'about.companyInfo.foundedValue',
  'companyInfo.note': 'about.companyInfo.note',
}

const contactI18nMap: Record<string, string> = {
  'title': 'contact.title',
  'subtitle': 'contact.subtitle',
  'info.email': 'contact.info.email',
  'info.emailValue': 'contact.info.emailValue',
  'info.businessHours': 'contact.info.businessHours',
  'info.support247': 'contact.info.support247',
  'info.responseTime': 'contact.info.responseTime',
  'info.address': 'contact.info.address',
  'info.addressValue': 'contact.info.addressValue',
  'urgent.title': 'contact.urgent.title',
  'urgent.description': 'contact.urgent.description',
  'urgent.button': 'contact.urgent.button',
}

type PageTab = 'about' | 'contact'

export default function AdminContent() {
  const { t, i18n } = useTranslation()
  const [activeTab, setActiveTab] = useState<PageTab>('about')
  const [locale, setLocale] = useState(i18n.language === 'zh' ? 'zh' : 'en')
  const [sections, setSections] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fields = activeTab === 'about' ? aboutFields : contactFields
  const i18nMap = activeTab === 'about' ? aboutI18nMap : contactI18nMap

  const fetchContent = async () => {
    setLoading(true)
    try {
      const data = await api<PageContentResponse>(`/content/${activeTab}?locale=${locale}`)
      // Pre-fill with i18n defaults, then overlay API data
      const defaults: Record<string, string> = {}
      for (const field of fields) {
        const i18nKey = i18nMap[field.key]
        if (i18nKey) {
          defaults[field.key] = t(i18nKey, { lng: locale })
        }
      }
      setSections({ ...defaults, ...data.sections })
    } catch {
      // On error, use i18n defaults
      const defaults: Record<string, string> = {}
      for (const field of fields) {
        const i18nKey = i18nMap[field.key]
        if (i18nKey) {
          defaults[field.key] = t(i18nKey, { lng: locale })
        }
      }
      setSections(defaults)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchContent()
  }, [activeTab, locale])

  const handleSave = async () => {
    setSaving(true)
    try {
      await api(`/admin/content/${activeTab}`, {
        method: 'PUT',
        body: JSON.stringify({ locale, sections }),
      })
      toast.success(t('admin.content.saved'))
    } catch {
      toast.error(t('admin.content.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    const defaults: Record<string, string> = {}
    for (const field of fields) {
      const i18nKey = i18nMap[field.key]
      if (i18nKey) {
        defaults[field.key] = t(i18nKey, { lng: locale })
      }
    }
    setSections(defaults)
  }

  const handleFieldChange = (key: string, value: string) => {
    setSections((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-text">{t('admin.content.title')}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} disabled={saving}>
            <RotateCcw className="w-4 h-4 mr-2" />
            {t('admin.content.resetDefault')}
          </Button>
          <Button onClick={() => void handleSave()} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? t('admin.content.saving') : t('admin.content.save')}
          </Button>
        </div>
      </div>

      {/* Tab + Locale selectors */}
      <div className="flex items-center gap-4">
        <div className="flex rounded-lg border border-border overflow-hidden">
          <button
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'about'
                ? 'bg-primary text-white'
                : 'bg-surface text-text-secondary hover:text-text'
            }`}
            onClick={() => setActiveTab('about')}
          >
            {t('admin.content.aboutPage')}
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'contact'
                ? 'bg-primary text-white'
                : 'bg-surface text-text-secondary hover:text-text'
            }`}
            onClick={() => setActiveTab('contact')}
          >
            {t('admin.content.contactPage')}
          </button>
        </div>

        <div className="flex rounded-lg border border-border overflow-hidden">
          <button
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              locale === 'en'
                ? 'bg-primary text-white'
                : 'bg-surface text-text-secondary hover:text-text'
            }`}
            onClick={() => setLocale('en')}
          >
            EN
          </button>
          <button
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              locale === 'zh'
                ? 'bg-primary text-white'
                : 'bg-surface text-text-secondary hover:text-text'
            }`}
            onClick={() => setLocale('zh')}
          >
            中文
          </button>
        </div>
      </div>

      {/* Content form */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-5">
            {fields.map((field) => (
              <div key={field.key}>
                {field.multiline ? (
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-text-secondary">
                      {t(`admin.content.${field.label}`)}
                    </label>
                    <textarea
                      rows={3}
                      className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors duration-150"
                      value={sections[field.key] ?? ''}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    />
                  </div>
                ) : (
                  <Input
                    label={t(`admin.content.${field.label}`)}
                    value={sections[field.key] ?? ''}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
