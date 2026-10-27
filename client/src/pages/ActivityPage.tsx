import { useTranslation } from 'react-i18next'

export function ActivityPage() {
  const { t } = useTranslation()
  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">{t('activity.title')}</h1>
        <p className="page-desc">{t('activity.desc')}</p>
      </header>
      <section className="card">
        <p style={{ color: 'var(--text-secondary)' }}>{t('activity.empty')}</p>
      </section>
    </div>
  )
}
