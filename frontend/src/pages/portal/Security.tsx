import { useState, type FormEvent } from 'react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import { useAuthStore } from '../../stores/auth'
import { api } from '../../lib/utils'
import { Lock, Shield, Clock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toDateLocale } from '../../i18n/locale'

export default function Security() {
  const token = useAuthStore((state) => state.token)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const { t, i18n } = useTranslation()
  const locale = toDateLocale(i18n.language)

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (newPassword.length < 8) {
      setError(t('portal.security.passwordMin'))
      return
    }

    if (newPassword !== confirmPassword) {
      setError(t('portal.security.passwordMismatch'))
      return
    }

    setLoading(true)

    try {
      await api('/portal/change-password', {
        method: 'POST',
        token: token || undefined,
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      })
      setSuccess(t('portal.security.passwordChanged'))
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('portal.security.passwordChangeFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text">{t('portal.security.title')}</h1>
        <p className="text-text-secondary mt-2">{t('portal.security.subtitle')}</p>
      </div>

      <Card>
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-text mb-1">{t('portal.security.changePasswordTitle')}</h2>
            <p className="text-text-secondary text-sm">{t('portal.security.changePasswordDescription')}</p>
          </div>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-cta/10 border border-cta/20 text-cta text-sm">
              {success}
            </div>
          )}

          <Input
            id="currentPassword"
            type="password"
            label={t('portal.security.currentPassword')}
            placeholder={t('portal.security.currentPasswordPlaceholder')}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />

          <Input
            id="newPassword"
            type="password"
            label={t('portal.security.newPassword')}
            placeholder={t('portal.security.newPasswordPlaceholder')}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />

          <Input
            id="confirmPassword"
            type="password"
            label={t('portal.security.confirmNewPassword')}
            placeholder={t('portal.security.confirmNewPasswordPlaceholder')}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <Button type="submit" disabled={loading}>
            {loading ? t('portal.security.submitting') : t('portal.security.submit')}
          </Button>
        </form>
      </Card>

      <Card>
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-cta/10 flex items-center justify-center flex-shrink-0">
            <Clock className="w-6 h-6 text-cta" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-text mb-1">{t('portal.security.sessionTitle')}</h2>
            <p className="text-text-secondary text-sm">{t('portal.security.sessionDescription')}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-border/50">
            <span className="text-sm text-text-secondary">{t('portal.security.currentDevice')}</span>
            <Badge variant="success">{t('status.active')}</Badge>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-text-secondary">{t('portal.security.loginTime')}</span>
            <span className="text-sm text-text">{new Date().toLocaleString(locale)}</span>
          </div>
        </div>
      </Card>

      <Card className="bg-surface/50">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center flex-shrink-0">
            <Shield className="w-6 h-6 text-warning" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-text mb-1">{t('portal.security.twoFactorTitle')}</h2>
            <p className="text-text-secondary text-sm mb-3">{t('portal.security.twoFactorDescription')}</p>
            <Badge variant="warning">{t('portal.security.comingSoon')}</Badge>
          </div>
        </div>
      </Card>
    </div>
  )
}
