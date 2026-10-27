import { useTranslation } from 'react-i18next'
import { Devices } from '../features/devices/Devices'

export function DevicesPage() {
  const { t } = useTranslation()
  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">{t('devices.title')}</h1>
        <p className="page-desc">{t('devices.pageDesc')}</p>
      </header>
      <Devices />
    </div>
  )
}
