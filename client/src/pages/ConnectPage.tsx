import { useTranslation } from 'react-i18next'
import { QRCodeConnect } from '../components/qr/QRCodeConnect'

export function ConnectPage() {
  const { t } = useTranslation()
  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">{t('qr.pageTitle')}</h1>
        <p className="page-desc">{t('qr.pageDesc')}</p>
      </header>
      <div style={{ maxWidth: '500px' }}>
        <QRCodeConnect />
      </div>
    </div>
  )
}
