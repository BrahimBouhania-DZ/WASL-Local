import { useTranslation } from 'react-i18next'
import { ScreenShare } from '../features/screen/ScreenShare'

export function ScreenPage() {
  const { t } = useTranslation()
  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">{t('screen.title')}</h1>
        <p className="page-desc">{t('screen.pageDesc')}</p>
      </header>
      <ScreenShare />
    </div>
  )
}
