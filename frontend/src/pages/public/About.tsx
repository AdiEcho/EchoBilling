import { Building2, Target, Users, Award } from 'lucide-react'
import Card from '../../components/ui/Card'
import { useTranslation } from 'react-i18next'

export default function About() {
  const { t } = useTranslation()

  const values = [
    { icon: Target, key: 'mission' },
    { icon: Users, key: 'customer' },
    { icon: Award, key: 'quality' },
  ]

  return (
    <div className="min-h-screen py-20 px-4 bg-bg">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-text mb-4">
            {t('about.title')}
          </h1>
          <p className="text-xl text-text-secondary">{t('about.subtitle')}</p>
        </div>

        <Card className="mb-12">
          <div className="flex items-start space-x-4">
            <div className="p-3 rounded-lg bg-primary/10 text-primary">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="font-heading text-2xl font-bold text-text mb-3">
                {t('about.company.title')}
              </h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                {t('about.company.paragraph1')}
              </p>
              <p className="text-text-secondary leading-relaxed">{t('about.company.paragraph2')}</p>
            </div>
          </div>
        </Card>

        <div className="mb-12">
          <h2 className="font-heading text-3xl font-bold text-text mb-8 text-center">
            {t('about.valuesTitle')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {values.map((value) => {
              const Icon = value.icon
              return (
                <Card key={value.key} hover>
                  <div className="text-center">
                    <div className="inline-flex p-3 rounded-lg bg-primary/10 text-primary mb-4">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-heading text-xl font-semibold text-text mb-2">
                      {t(`about.values.${value.key}.title`)}
                    </h3>
                    <p className="text-text-secondary text-sm">{t(`about.values.${value.key}.description`)}</p>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>

        <Card className="bg-surface/50">
          <h2 className="font-heading text-2xl font-bold text-text mb-4">
            {t('about.companyInfoTitle')}
          </h2>
          <div className="space-y-2 text-text-secondary">
            <p>
              <span className="font-medium text-text">{t('about.companyInfo.legalEntity')}</span>{' '}
              {t('about.company.title')}
            </p>
            <p>
              <span className="font-medium text-text">{t('about.companyInfo.registration')}</span>{' '}
              {t('about.companyInfo.registrationValue')}
            </p>
            <p>
              <span className="font-medium text-text">{t('about.companyInfo.founded')}</span>{' '}
              {t('about.companyInfo.foundedValue')}
            </p>
            <p className="text-sm text-text-muted mt-4">{t('about.companyInfo.note')}</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
