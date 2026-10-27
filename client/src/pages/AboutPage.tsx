import { useTranslation } from 'react-i18next'

export function AboutPage() {
  const { t } = useTranslation()
  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">{t('about.title')}</h1>
        <p className="page-desc">{t('about.desc')}</p>
      </header>
      <section className="card">
        <h3>LinkDesk Local</h3>
        <p style={{ color: 'var(--text-secondary)' }}>v0.1.0 - Local-first network utility</p>
        <p style={{ color: 'var(--text-secondary)' }}>{t('about.privacy')}</p>
      </section>
    </div>
  )
}
