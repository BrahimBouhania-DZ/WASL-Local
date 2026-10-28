import { useTranslation } from 'react-i18next'
import { Wifi, WifiOff, Shield, Loader } from 'lucide-react'
import { useSettings } from '../../context/SettingsContext'
import { useWs } from '../../context/WsContext'

import { purgeSessionApi } from '../../services/api'
import { Trash2 } from 'lucide-react'
import { useToast } from '../../context/ToastContext'

export function Header() {
  const { t } = useTranslation()
  const { settings, updateSettings } = useSettings()
  const { status } = useWs()
  const { success, warning } = useToast()

  const toggleTheme = () => {
    const themes: Array<'light' | 'dark' | 'auto'> = ['light', 'dark', 'auto']
    const idx = themes.indexOf(settings.theme)
    updateSettings({ theme: themes[(idx + 1) % themes.length] })
  }

  const handlePurgeSession = async () => {
    const confirmed = window.confirm('هل أنت متأكد من إنهاء الجلسة ومسح جميع الملفات والبيانات المتبادلة نهائياً؟')
    if (!confirmed) return

    try {
      await purgeSessionApi()
      // Clear local storage pairing tokens
      localStorage.removeItem('linkdesk_device_id')
      localStorage.removeItem('linkdesk_auth_token')
      localStorage.removeItem('linkdesk_session_id')
      localStorage.removeItem('linkdesk_selected_targets')
      success('تم مسح بيانات الجلسة بالكامل وإعادة التهيئة')
      setTimeout(() => {
        window.location.reload()
      }, 800)
    } catch {
      warning('تعذر إتمام مسح الجلسة')
    }
  }

  const wsColor =
    status === 'connected' ? 'var(--success)' :
    status === 'connecting' ? 'var(--warning)' :
    'var(--error)'

  const WsIcon = status === 'connected' ? Wifi : status === 'connecting' ? Loader : WifiOff

  return (
    <header className="header">
      <div className="header-info">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: wsColor, fontSize: '0.875rem' }}>
          <WsIcon
            size={15}
            style={{ animation: status === 'connecting' ? 'spin 1s linear infinite' : 'none' }}
          />
          <span>
            {status === 'connected'
              ? t('header.localNetwork')
              : status === 'connecting'
              ? (t('header.connecting') || 'Connecting…')
              : (t('header.offline') || 'Offline')}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          <Shield size={15} />
          <span>{t('header.secure')}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <button
          className="btn"
          onClick={handlePurgeSession}
          style={{ fontSize: '0.75rem', color: 'var(--error)', borderColor: 'rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.35rem 0.65rem' }}
          title="إنهاء الجلسة ومسح البيانات"
        >
          <Trash2 size={13} />
          <span>مسح الجلسة</span>
        </button>

        <button className="btn" onClick={toggleTheme} style={{ fontSize: '0.8rem' }}>
          {settings.theme === 'dark' ? '☀️' : settings.theme === 'light' ? '🔆' : '🌙'}
        </button>
        <select
          className="input"
          value={settings.language}
          onChange={e => updateSettings({ language: e.target.value })}
          style={{ fontSize: '0.8rem' }}
        >
          <option value="ar">العربية</option>
          <option value="fr">Français</option>
          <option value="en">English</option>
        </select>
      </div>
    </header>
  )
}
