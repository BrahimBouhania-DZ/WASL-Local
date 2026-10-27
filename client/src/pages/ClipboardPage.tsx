import { useTranslation } from 'react-i18next'
import { Clipboard } from '../features/clipboard/Clipboard'

export function ClipboardPage() {
  const { t } = useTranslation()
  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">{t('clipboard.title')}</h1>
        <p className="page-desc">{t('clipboard.pageDesc')}</p>
      </header>
      <Clipboard />
    </div>
  )
}
