import { useTranslation } from 'react-i18next'
import { Wifi, Shield } from 'lucide-react'
import { useSettings } from '../../context/SettingsContext'

export function Header() {
  const { t } = useTranslation()
  const { settings, updateSettings } = useSettings()

  const toggleTheme = () => {
    const themes: Array<'light' | 'dark' | 'auto'> = ['light', 'dark', 'auto']
    const idx = themes.indexOf(settings.theme)
    updateSettings({ theme: themes[(idx + 1) % themes.length] })
  }

  const changeLang = (lang: string) => {
    updateSettings({ language: lang })
  }

  return (
    <header className="header">
      <div className="header-info">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Wifi size={16} />
          <span>{t('header.localNetwork')}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Shield size={16} />
          <span>{t('header.secure')}</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <button className="btn" onClick={toggleTheme}>
          {settings.theme === 'dark' ? t('theme.light') : settings.theme === 'light' ? t('theme.auto') : t('theme.dark')}
        </button>
        <select className="input" value={settings.language} onChange={(e) => changeLang(e.target.value)}>
          <option value="ar">العربية</option>
          <option value="fr">Français</option>
          <option value="en">English</option>
        </select>
      </div>
    </header>
  )
}
