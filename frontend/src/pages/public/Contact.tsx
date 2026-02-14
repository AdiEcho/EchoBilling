import { useState } from 'react'
import { Mail, Clock, MapPin, Send, CheckCircle } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { useTranslation } from 'react-i18next'

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const { t } = useTranslation()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setFormData({ name: '', email: '', subject: '', message: '' })
    setTimeout(() => setSubmitted(false), 5000)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="min-h-screen py-20 px-4 bg-bg">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-text mb-4">
            {t('contact.title')}
          </h1>
          <p className="text-xl text-text-secondary">{t('contact.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <h2 className="font-heading text-2xl font-bold text-text mb-6">
                {t('contact.sendMessage')}
              </h2>

              {submitted && (
                <div className="flex items-center gap-3 rounded-lg border border-cta/30 bg-cta/5 px-4 py-3 mb-6 text-sm text-cta">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  {t('contact.form.success')}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    id="name"
                    name="name"
                    label={t('contact.form.name')}
                    placeholder={t('contact.form.namePlaceholder')}
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    label={t('contact.form.email')}
                    placeholder={t('common.emailPlaceholder')}
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <Input
                  id="subject"
                  name="subject"
                  label={t('contact.form.subject')}
                  placeholder={t('contact.form.subjectPlaceholder')}
                  value={formData.subject}
                  onChange={handleChange}
                  required
                />

                <div className="space-y-1.5">
                  <label htmlFor="message" className="block text-sm font-medium text-text-secondary">
                    {t('contact.form.message')}
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={6}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors duration-150"
                    placeholder={t('contact.form.messagePlaceholder')}
                    value={formData.message}
                    onChange={handleChange}
                    required
                  />
                </div>

                <Button type="submit" variant="cta" size="lg" className="w-full md:w-auto">
                  <Send className="w-4 h-4 mr-2" />
                  {t('contact.form.send')}
                </Button>
              </form>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <div className="flex items-start space-x-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-medium text-text mb-1">{t('contact.info.email')}</h3>
                  <a
                    href="mailto:support@echobilling.com"
                    className="text-text-secondary hover:text-primary transition-colors"
                  >
                    support@echobilling.com
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-medium text-text mb-1">{t('contact.info.businessHours')}</h3>
                  <p className="text-text-secondary text-sm">{t('contact.info.support247')}</p>
                  <p className="text-text-secondary text-sm">{t('contact.info.responseTime')}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-medium text-text mb-1">{t('contact.info.address')}</h3>
                  <p className="text-text-secondary text-sm">{t('contact.info.addressValue')}</p>
                </div>
              </div>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <h3 className="font-heading text-lg font-semibold text-text mb-2">
                {t('contact.urgent.title')}
              </h3>
              <p className="text-text-secondary text-sm mb-4">{t('contact.urgent.description')}</p>
              <Button variant="primary" size="sm" className="w-full">
                {t('contact.urgent.button')}
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
