import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Home, QrCode, FolderOpen, FileText, Clipboard, Monitor } from 'lucide-react'

export function MobileNav() {
  const { t } = useTranslation()

  const links = [
    { to: '/', icon: Home, label: t('nav.dashboard') },
    { to: '/connect', icon: QrCode, label: t('nav.connect') },
    { to: '/files', icon: FolderOpen, label: t('nav.files') },
    { to: '/text', icon: FileText, label: t('nav.text') },
    { to: '/clipboard', icon: Clipboard, label: t('nav.clipboard') },
    { to: '/screen', icon: Monitor, label: t('nav.screen') }
  ]

  return (
    <nav className="mobile-nav" aria-label="Mobile Navigation">
      {links.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}
          title={label}
        >
          <Icon size={20} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
