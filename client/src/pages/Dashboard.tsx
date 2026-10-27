import { useTranslation } from 'react-i18next'
import { Pairing } from '../features/pairing/Pairing'
import { Devices } from '../features/devices/Devices'

export function Dashboard() {
  const { t } = useTranslation()

  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">{t('dashboard.title')}</h1>
        <p className="page-desc">{t('dashboard.desc')}</p>
      </header>
      <div className="grid">
        <Pairing />
        <Devices />
      </div>
    </div>
  )
}
