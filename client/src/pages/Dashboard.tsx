import { useTranslation } from 'react-i18next'
import { Pairing } from '../features/pairing/Pairing'
import { Devices } from '../features/devices/Devices'
import { MobileDashboard } from '../components/mobile/MobileDashboard'
import { detectCurrentDevice } from '../utils/deviceDetector'

export function Dashboard() {
  const { t } = useTranslation()
  const isMobile = detectCurrentDevice().type === 'phone'

  if (isMobile) {
    return <MobileDashboard />
  }

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
