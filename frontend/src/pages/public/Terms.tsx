import Card from '../../components/ui/Card'
import { useTranslation } from 'react-i18next'
import { useBrandingStore } from '../../stores/branding'

interface PolicySection {
  title: string
  paragraphs?: string[]
  list?: string[]
  orderedList?: string[]
  afterList?: string
  email?: string
}

export default function Terms() {
  const { t } = useTranslation()
  const siteName = useBrandingStore((s) => s.siteName)
  const companyLegalName = useBrandingStore((s) => s.companyLegalName)
  const siteDomain = useBrandingStore((s) => s.siteDomain)
  const brand = { company: siteName, companyLegal: companyLegalName, domain: siteDomain }
  const sections = t('terms.sections', { returnObjects: true, ...brand }) as PolicySection[]

  return (
    <div className="min-h-screen py-20 px-4 bg-bg">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-text mb-4">{t('terms.title')}</h1>
          <p className="text-text-secondary">{t('common.lastUpdated')}</p>
        </div>

        <Card className="prose prose-invert max-w-none">
          <div className="space-y-8">
            {sections.map((section, idx) => (
              <section key={idx}>
                <h2 className="font-heading text-2xl font-bold text-text mb-4">{section.title}</h2>

                {section.paragraphs?.map((paragraph, paragraphIdx) => (
                  <p key={paragraphIdx} className="text-text-secondary leading-relaxed mb-3 last:mb-0">
                    {paragraph}
                  </p>
                ))}

                {section.list && section.list.length > 0 && (
                  <ul className="list-disc list-inside text-text-secondary space-y-2 ml-4">
                    {section.list.map((item, itemIdx) => (
                      <li key={itemIdx}>{item}</li>
                    ))}
                  </ul>
                )}

                {section.orderedList && section.orderedList.length > 0 && (
                  <ol className="list-decimal list-inside text-text-secondary space-y-2 ml-4">
                    {section.orderedList.map((item, itemIdx) => (
                      <li key={itemIdx}>{item}</li>
                    ))}
                  </ol>
                )}

                {section.afterList && (
                  <p className="text-text-secondary leading-relaxed mt-3">{section.afterList}</p>
                )}

                {section.email && (
                  <p className="text-text-secondary leading-relaxed mt-3">
                    <span className="text-primary">{section.email}</span>
                  </p>
                )}
              </section>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
