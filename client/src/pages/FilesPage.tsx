import { useTranslation } from 'react-i18next'
import { Files } from '../features/files/Files'

export function FilesPage() {
  const { t } = useTranslation()
  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">{t('files.title')}</h1>
        <p className="page-desc">{t('files.pageDesc')}</p>
      </header>
      <Files />
    </div>
  )
}
