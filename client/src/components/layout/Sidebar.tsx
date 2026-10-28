import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Home, Smartphone, FolderOpen, FileText, Clipboard, Monitor, Settings, QrCode } from 'lucide-react'

export function Sidebar() {
  const { t } = useTranslation()

  const links = [
    { to: '/', icon: Home, label: t('nav.dashboard') },
    { to: '/connect', icon: QrCode, label: t('nav.connect') },
    { to: '/files', icon: FolderOpen, label: t('nav.files') },
    { to: '/text', icon: FileText, label: t('nav.text') },
    { to: '/clipboard', icon: Clipboard, label: t('nav.clipboard') },
    { to: '/screen', icon: Monitor, label: t('nav.screen') },
    { to: '/devices', icon: Smartphone, label: t('nav.devices') },
    { to: '/settings', icon: Settings, label: t('nav.settings') }
  ]

  return (
    <aside className="sidebar">
      <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 0.5rem' }}>
        <img
          src="/wasl-logo.png"
          alt="WASL Local Logo"
          style={{ width: '42px', height: '42px', borderRadius: '10px', objectFit: 'cover', boxShadow: '0 4px 12px rgba(0, 212, 255, 0.25)' }}
        />
        <div>
          <div className="sidebar-title" style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #00d4ff, #ffffff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            WASL Local
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>وَصْل • نقل محلي فائق</div>
        </div>
      </div>
      <nav className="sidebar-nav">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} end={to === '/'}>
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <span style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', background: 'var(--success)' }} />
          <span>اتصال محلي مشفر 100%</span>
        </div>
      </div>
    </aside>
  )
}
