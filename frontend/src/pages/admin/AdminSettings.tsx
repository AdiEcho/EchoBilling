import { useState, useEffect } from 'react'
import { Save, Mail, CreditCard, Webhook, Send, Building2 } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { api } from '../../lib/utils'
import { toast } from '../../stores/toast'
import { useTranslation } from 'react-i18next'

interface SettingItem {
  key: string
  value: string
  is_secret: boolean
  description: string
  group_name: string
}

type TabGroup = 'branding' | 'smtp' | 'stripe' | 'webhook'

const tabs: { group: TabGroup; icon: typeof Mail; labelKey: string }[] = [
  { group: 'branding', icon: Building2, labelKey: 'admin.settings.brandingTab' },
  { group: 'smtp', icon: Mail, labelKey: 'admin.settings.smtpTab' },
  { group: 'stripe', icon: CreditCard, labelKey: 'admin.settings.stripeTab' },
  { group: 'webhook', icon: Webhook, labelKey: 'admin.settings.webhookTab' },
]

export default function AdminSettings() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<TabGroup>('branding')
  const [settings, setSettings] = useState<SettingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [sendingTest, setSendingTest] = useState(false)

  const fetchSettings = async (group: TabGroup) => {
    setLoading(true)
    try {
      const data = await api<SettingItem[]>(`/admin/settings?group=${group}`)
      setSettings(data || [])
    } catch {
      toast.error(t('admin.settings.loadFailed'))
      setSettings([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchSettings(activeTab)
  }, [activeTab])

  const handleChange = (key: string, value: string) => {
    setSettings((prev) =>
      prev.map((s) => (s.key === key ? { ...s, value } : s))
    )
  }

  const handleFocus = (item: SettingItem) => {
    if (item.is_secret && item.value.startsWith('***')) {
      handleChange(item.key, '')
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const updates: Record<string, string> = {}
      for (const s of settings) {
        updates[s.key] = s.value
      }
      await api('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({ settings: updates }),
      })
      toast.success(t('admin.settings.saved'))
      // Reload to get fresh masked values
      void fetchSettings(activeTab)
    } catch {
      toast.error(t('admin.settings.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const handleTestSMTP = async () => {
    if (!testEmail) return
    setSendingTest(true)
    try {
      await api('/admin/settings/test-smtp', {
        method: 'POST',
        body: JSON.stringify({ email: testEmail }),
      })
      toast.success(t('admin.settings.testSent'))
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t('admin.settings.testFailed')
      )
    } finally {
      setSendingTest(false)
    }
  }

  const labelForKey = (key: string): string => {
    const k = `admin.settings.fields.${key}`
    const val = t(k)
    // If no translation found, fallback to key
    return val === k ? key : val
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-text">
        {t('admin.settings.title')}
      </h1>

      {/* Tab selectors */}
      <div className="flex rounded-lg border border-border overflow-hidden w-fit">
        {tabs.map(({ group, icon: Icon, labelKey }) => (
          <button
            key={group}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === group
                ? 'bg-primary text-white'
                : 'bg-surface text-text-secondary hover:text-text'
            }`}
            onClick={() => setActiveTab(group)}
          >
            <Icon className="w-4 h-4" />
            {t(labelKey)}
          </button>
        ))}
      </div>

      {/* Settings form */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-5">
            {settings.map((item) => (
              <Input
                key={item.key}
                label={labelForKey(item.key)}
                type={item.is_secret ? 'password' : 'text'}
                value={item.value}
                placeholder={item.description}
                onChange={(e) => handleChange(item.key, e.target.value)}
                onFocus={() => handleFocus(item)}
              />
            ))}

            <div className="flex justify-end pt-2">
              <Button onClick={() => void handleSave()} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving
                  ? t('admin.settings.saving')
                  : t('admin.settings.save')}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Test SMTP */}
      {activeTab === 'smtp' && (
        <Card>
          <h2 className="text-lg font-semibold text-text mb-4">
            {t('admin.settings.testSmtpTitle')}
          </h2>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Input
                label={t('admin.settings.testEmail')}
                type="email"
                value={testEmail}
                placeholder="test@example.com"
                onChange={(e) => setTestEmail(e.target.value)}
              />
            </div>
            <Button
              onClick={() => void handleTestSMTP()}
              disabled={sendingTest || !testEmail}
              variant="outline"
            >
              <Send className="w-4 h-4 mr-2" />
              {sendingTest
                ? t('admin.settings.sending')
                : t('admin.settings.sendTest')}
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
