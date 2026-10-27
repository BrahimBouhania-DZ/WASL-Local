import { useTranslation } from 'react-i18next'
import { TextShare } from '../features/text/TextShare'

export function TextPage() {
  const { t } = useTranslation()
  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">{t('text.title')}</h1>
        <p className="page-desc">{t('text.pageDesc')}</p>
      </header>
      <TextShare />
    </div>
  )
}
