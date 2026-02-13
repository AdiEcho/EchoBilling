import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { useAuthStore } from '../../stores/auth'
import { UserPlus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const register = useAuthStore((state) => state.register)
  const navigate = useNavigate()
  const { t } = useTranslation()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError(t('auth.register.passwordMin'))
      return
    }

    if (password !== confirmPassword) {
      setError(t('auth.register.passwordMismatch'))
      return
    }

    setLoading(true)

    try {
      await register(email, password, name)
      navigate('/portal/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.register.failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
            <UserPlus className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-text">{t('auth.register.title')}</h1>
          <p className="text-sm text-text-secondary mt-2">{t('auth.register.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
              {error}
            </div>
          )}

          <Input
            id="name"
            type="text"
            label={t('auth.register.name')}
            placeholder={t('auth.register.namePlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            id="email"
            type="email"
            label={t('auth.register.email')}
            placeholder={t('common.emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            id="password"
            type="password"
            label={t('auth.register.password')}
            placeholder={t('auth.register.passwordPlaceholder')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Input
            id="confirmPassword"
            type="password"
            label={t('auth.register.confirmPassword')}
            placeholder={t('auth.register.confirmPasswordPlaceholder')}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('auth.register.submitting') : t('auth.register.submit')}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-text-secondary">
          {t('auth.register.hasAccount')}{' '}
          <Link to="/login" className="text-primary hover:underline">
            {t('auth.register.loginNow')}
          </Link>
        </div>
      </Card>
    </div>
  )
}
