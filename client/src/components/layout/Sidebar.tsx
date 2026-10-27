import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Home, Smartphone, FolderOpen, FileText, Clipboard, Monitor, Activity, Settings, Info } from 'lucide-react'

export function Sidebar() {
  const { t } = useTranslation()

  const links = [
    { to: '/', icon: Home, label: t('nav.dashboard') },
    { to: '/devices', icon: Smartphone, label: t('nav.devices') },
    { to: '/files', icon: FolderOpen, label: t('nav.files') },
    { to: '/text', icon: FileText, label: t('nav.text') },
    { to: '/clipboard', icon: Clipboard, label: t('nav.clipboard') },
    { to: '/screen', icon: Monitor, label: t('nav.screen') },
    { to: '/activity', icon: Activity, label: t('nav.activity') },
    { to: '/settings', icon: Settings, label: t('nav.settings') },
    { to: '/about', icon: Info, label: t('nav.about') }
  ]

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">LD</div>
        <div>
          <div className="sidebar-title">LinkDesk Local</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>v0.1.0</div>
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
        <div>Local Network Only</div>
      </div>
    </aside>
  )
}
