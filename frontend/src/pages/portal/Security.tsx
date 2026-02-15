import { useState, useEffect, type FormEvent } from 'react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import { useAuthStore } from '../../stores/auth'
import { api } from '../../lib/utils'
import { Lock, Shield, Clock, Smartphone, Mail, Copy, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toDateLocale } from '../../i18n/locale'
import { QRCodeSVG } from 'qrcode.react'

type SetupMethod = 'totp' | 'email'
type SetupStep = 'qr' | 'verify' | 'recovery'

interface TwoFAStatus {
  enabled: boolean
  method?: string
}

export default function Security() {
  const token = useAuthStore((state) => state.token)
  const loadUser = useAuthStore((state) => state.loadUser)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const { t, i18n } = useTranslation()
  const locale = toDateLocale(i18n.language)

  // 2FA state
  const [tfaStatus, setTfaStatus] = useState<TwoFAStatus>({ enabled: false })
  const [setupModalOpen, setSetupModalOpen] = useState(false)
  const [setupMethod, setSetupMethod] = useState<SetupMethod>('totp')
  const [setupStep, setSetupStep] = useState<SetupStep>('qr')
  const [totpSecret, setTotpSecret] = useState('')
  const [totpUri, setTotpUri] = useState('')
  const [verifyCode, setVerifyCode] = useState('')
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])
  const [setupLoading, setSetupLoading] = useState(false)
  const [setupError, setSetupError] = useState('')
  const [emailCooldown, setEmailCooldown] = useState(0)
  const [copiedSecret, setCopiedSecret] = useState(false)
  const [copiedCodes, setCopiedCodes] = useState(false)

  // Disable/Regenerate modals
  const [disableModalOpen, setDisableModalOpen] = useState(false)
  const [regenerateModalOpen, setRegenerateModalOpen] = useState(false)
  const [confirmPwd, setConfirmPwd] = useState('')
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState('')

  // Load 2FA status
  useEffect(() => {
    load2FAStatus()
  }, [])

  // Email cooldown timer
  useEffect(() => {
    if (emailCooldown <= 0) return
    const timer = setTimeout(() => setEmailCooldown(emailCooldown - 1), 1000)
    return () => clearTimeout(timer)
  }, [emailCooldown])

  const load2FAStatus = async () => {
    try {
      const status = await api<TwoFAStatus>('/portal/2fa/status', { token: token || undefined })
      setTfaStatus(status)
    } catch {
      // ignore
    }
  }

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

  // Setup TOTP
  const handleSetupTOTP = async () => {
    setSetupMethod('totp')
    setSetupStep('qr')
    setVerifyCode('')
    setSetupError('')
    setSetupLoading(true)
    setSetupModalOpen(true)

    try {
      const data = await api<{ secret: string; uri: string }>('/portal/2fa/setup/totp', {
        method: 'POST',
        token: token || undefined,
      })
      setTotpSecret(data.secret)
      setTotpUri(data.uri)
    } catch (err) {
      setSetupError(err instanceof Error ? err.message : 'Failed to setup TOTP')
    } finally {
      setSetupLoading(false)
    }
  }

  // Setup Email
  const handleSetupEmail = async () => {
    setSetupMethod('email')
    setSetupStep('verify')
    setVerifyCode('')
    setSetupError('')
    setSetupModalOpen(true)
  }

  const handleSendSetupEmailCode = async () => {
    try {
      await api('/portal/2fa/setup/email', {
        method: 'POST',
        token: token || undefined,
      })
      setEmailCooldown(60)
    } catch (err) {
      setSetupError(err instanceof Error ? err.message : 'Failed to send code')
    }
  }

  // Verify and enable 2FA
  const handleVerifyAndEnable = async (e: FormEvent) => {
    e.preventDefault()
    setSetupError('')
    setSetupLoading(true)

    try {
      const data = await api<{ recovery_codes: string[] }>('/portal/2fa/enable', {
        method: 'POST',
        token: token || undefined,
        body: JSON.stringify({
          code: verifyCode,
          method: setupMethod,
          ...(setupMethod === 'totp' ? { secret: totpSecret } : {}),
        }),
      })
      setRecoveryCodes(data.recovery_codes)
      setSetupStep('recovery')
      await load2FAStatus()
      await loadUser()
    } catch (err) {
      setSetupError(err instanceof Error ? err.message : t('portal.security.twoFactor.invalidCode'))
    } finally {
      setSetupLoading(false)
    }
  }

  // Disable 2FA
  const handleDisable = async (e: FormEvent) => {
    e.preventDefault()
    setModalError('')
    setModalLoading(true)

    try {
      await api('/portal/2fa/disable', {
        method: 'POST',
        token: token || undefined,
        body: JSON.stringify({ password: confirmPwd }),
      })
      setDisableModalOpen(false)
      setConfirmPwd('')
      await load2FAStatus()
      await loadUser()
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Failed to disable 2FA')
    } finally {
      setModalLoading(false)
    }
  }

  // Regenerate recovery codes
  const handleRegenerate = async (e: FormEvent) => {
    e.preventDefault()
    setModalError('')
    setModalLoading(true)

    try {
      const data = await api<{ recovery_codes: string[] }>('/portal/2fa/recovery/regenerate', {
        method: 'POST',
        token: token || undefined,
        body: JSON.stringify({ password: confirmPwd }),
      })
      setRecoveryCodes(data.recovery_codes)
      setRegenerateModalOpen(false)
      setConfirmPwd('')
      // Show recovery codes in setup modal
      setSetupStep('recovery')
      setSetupModalOpen(true)
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Failed to regenerate codes')
    } finally {
      setModalLoading(false)
    }
  }

  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const closeSetupModal = () => {
    setSetupModalOpen(false)
    setVerifyCode('')
    setSetupError('')
    setTotpSecret('')
    setTotpUri('')
    setRecoveryCodes([])
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text">{t('portal.security.title')}</h1>
        <p className="text-text-secondary mt-2">{t('portal.security.subtitle')}</p>
      </div>

      {/* Change Password */}
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

      {/* Session Info */}
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

      {/* Two-Factor Authentication */}
      <Card>
        <div className="flex items-start gap-4 mb-4">
          <div className={`w-12 h-12 rounded-full ${tfaStatus.enabled ? 'bg-cta/10' : 'bg-warning/10'} flex items-center justify-center flex-shrink-0`}>
            <Shield className={`w-6 h-6 ${tfaStatus.enabled ? 'text-cta' : 'text-warning'}`} />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-text mb-1">{t('portal.security.twoFactorTitle')}</h2>
            <p className="text-text-secondary text-sm mb-3">{t('portal.security.twoFactorDescription')}</p>

            {tfaStatus.enabled ? (
              <>
                <Badge variant="success">{t('portal.security.twoFactor.enabled')}</Badge>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-sm text-text-secondary">{t('portal.security.twoFactor.method')}</span>
                    <span className="text-sm text-text flex items-center gap-1.5">
                      {tfaStatus.method === 'totp' ? (
                        <><Smartphone className="w-4 h-4" /> {t('portal.security.twoFactor.methodTOTP')}</>
                      ) : (
                        <><Mail className="w-4 h-4" /> {t('portal.security.twoFactor.methodEmail')}</>
                      )}
                    </span>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => { setDisableModalOpen(true); setConfirmPwd(''); setModalError('') }}
                    >
                      {t('portal.security.twoFactor.disable')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setRegenerateModalOpen(true); setConfirmPwd(''); setModalError('') }}
                    >
                      {t('portal.security.twoFactor.regenerateCodes')}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Badge variant="warning">{t('portal.security.twoFactor.notEnabled')}</Badge>
                <p className="text-text-secondary text-sm mt-3 mb-4">
                  {t('portal.security.twoFactor.notEnabledDesc')}
                </p>
                <div className="flex gap-3">
                  <Button size="sm" onClick={handleSetupTOTP}>
                    <Smartphone className="w-4 h-4 mr-1.5" />
                    {t('portal.security.twoFactor.enableTOTP')}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleSetupEmail}>
                    <Mail className="w-4 h-4 mr-1.5" />
                    {t('portal.security.twoFactor.enableEmail')}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Setup Modal */}
      <Modal
        open={setupModalOpen}
        onClose={closeSetupModal}
        title={setupMethod === 'totp'
          ? t('portal.security.twoFactor.setupTOTPTitle')
          : setupStep === 'recovery'
            ? t('portal.security.twoFactor.step3RecoveryCodes')
            : t('portal.security.twoFactor.setupEmailTitle')
        }
        className="max-w-lg"
      >
        {/* Step: QR Code (TOTP only) */}
        {setupMethod === 'totp' && setupStep === 'qr' && (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              {t('portal.security.twoFactor.step1ScanQRDesc')}
            </p>
            {setupLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : totpUri ? (
              <>
                <div className="flex justify-center p-4 bg-white rounded-lg">
                  <QRCodeSVG value={totpUri} size={200} />
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-text-secondary font-medium">
                    {t('portal.security.twoFactor.manualEntry')}
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-bg px-3 py-2 rounded-lg break-all font-mono text-text">
                      {totpSecret}
                    </code>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(totpSecret, setCopiedSecret)}
                      className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
                    >
                      {copiedSecret ? (
                        <Check className="w-4 h-4 text-cta" />
                      ) : (
                        <Copy className="w-4 h-4 text-text-secondary" />
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : null}
            {setupError && (
              <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
                {setupError}
              </div>
            )}
            <div className="flex justify-end">
              <Button onClick={() => setSetupStep('verify')} disabled={!totpSecret}>
                {t('portal.security.twoFactor.next')}
              </Button>
            </div>
          </div>
        )}

        {/* Step: Verify Code */}
        {setupStep === 'verify' && (
          <form onSubmit={handleVerifyAndEnable} className="space-y-4">
            <p className="text-sm text-text-secondary">
              {setupMethod === 'totp'
                ? t('portal.security.twoFactor.step2EnterCodeDesc')
                : t('portal.security.twoFactor.step2EmailCodeDesc')
              }
            </p>

            {setupMethod === 'email' && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleSendSetupEmailCode}
                disabled={emailCooldown > 0}
              >
                {emailCooldown > 0
                  ? t('portal.security.twoFactor.resendIn', { seconds: emailCooldown })
                  : t('portal.security.twoFactor.sendCode')
                }
              </Button>
            )}

            <Input
              id="setup-verify-code"
              type="text"
              label={t('portal.security.twoFactor.step2EnterCode')}
              placeholder={t('portal.security.twoFactor.enterCode')}
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value)}
              autoComplete="one-time-code"
              required
            />

            {setupError && (
              <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
                {setupError}
              </div>
            )}

            <div className="flex justify-between">
              {setupMethod === 'totp' && (
                <Button type="button" variant="ghost" onClick={() => setSetupStep('qr')}>
                  {t('portal.security.twoFactor.back')}
                </Button>
              )}
              <Button type="submit" disabled={setupLoading || !verifyCode} className="ml-auto">
                {setupLoading ? t('portal.security.twoFactor.verifying') : t('portal.security.twoFactor.verify')}
              </Button>
            </div>
          </form>
        )}

        {/* Step: Recovery Codes */}
        {setupStep === 'recovery' && recoveryCodes.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              {t('portal.security.twoFactor.step3RecoveryCodesDesc')}
            </p>

            <div className="bg-bg rounded-lg p-4">
              <div className="grid grid-cols-2 gap-2">
                {recoveryCodes.map((code, i) => (
                  <code key={i} className="text-sm font-mono text-text px-2 py-1 bg-surface rounded">
                    {code}
                  </code>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 text-warning text-sm">
              {t('portal.security.twoFactor.recoveryCodesWarning')}
            </div>

            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(recoveryCodes.join('\n'), setCopiedCodes)}
              >
                {copiedCodes ? <Check className="w-4 h-4 mr-1.5" /> : <Copy className="w-4 h-4 mr-1.5" />}
                {copiedCodes ? t('portal.security.twoFactor.codeSent') : 'Copy'}
              </Button>
              <Button onClick={closeSetupModal}>
                {t('portal.security.twoFactor.done')}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Disable 2FA Modal */}
      <Modal
        open={disableModalOpen}
        onClose={() => setDisableModalOpen(false)}
        title={t('portal.security.twoFactor.confirmDisableTitle')}
      >
        <form onSubmit={handleDisable} className="space-y-4">
          <p className="text-sm text-text-secondary">
            {t('portal.security.twoFactor.confirmDisableDesc')}
          </p>

          <Input
            id="disable-pwd"
            type="password"
            label={t('portal.security.twoFactor.confirmPassword')}
            value={confirmPwd}
            onChange={(e) => setConfirmPwd(e.target.value)}
            required
          />

          {modalError && (
            <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
              {modalError}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setDisableModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="danger" disabled={modalLoading || !confirmPwd}>
              {modalLoading ? t('portal.security.submitting') : t('portal.security.twoFactor.confirm')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Regenerate Recovery Codes Modal */}
      <Modal
        open={regenerateModalOpen}
        onClose={() => setRegenerateModalOpen(false)}
        title={t('portal.security.twoFactor.regenerateTitle')}
      >
        <form onSubmit={handleRegenerate} className="space-y-4">
          <p className="text-sm text-text-secondary">
            {t('portal.security.twoFactor.regenerateDesc')}
          </p>

          <Input
            id="regenerate-pwd"
            type="password"
            label={t('portal.security.twoFactor.confirmPassword')}
            value={confirmPwd}
            onChange={(e) => setConfirmPwd(e.target.value)}
            required
          />

          {modalError && (
            <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
              {modalError}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setRegenerateModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={modalLoading || !confirmPwd}>
              {modalLoading ? t('portal.security.submitting') : t('portal.security.twoFactor.confirm')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
