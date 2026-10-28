import { useTranslation } from 'react-i18next'
import { useActivity, ActivityType } from '../context/ActivityContext'
import { useWs } from '../context/WsContext'
import { Wifi, WifiOff, Loader, FileText, Clipboard, Smartphone, KeyRound, Info, Trash2 } from 'lucide-react'

const TYPE_ICONS: Record<ActivityType, React.ComponentType<any>> = {
  pairing: KeyRound,
  file: FileText,
  text: FileText,
  clipboard: Clipboard,
  device: Smartphone,
  info: Info
}

const TYPE_COLORS: Record<ActivityType, string> = {
  pairing: 'var(--primary)',
  file: 'var(--success)',
  text: 'var(--secondary)',
  clipboard: 'var(--warning)',
  device: 'var(--primary)',
  info: 'var(--text-secondary)'
}

export function ActivityPage() {
  const { t } = useTranslation()
  const { entries, clear } = useActivity()
  const { status } = useWs()

  const statusColor =
    status === 'connected' ? 'var(--success)' :
    status === 'connecting' ? 'var(--warning)' :
    'var(--error)'

  const StatusIcon = status === 'connected' ? Wifi : status === 'connecting' ? Loader : WifiOff

  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">{t('activity.title')}</h1>
        <p className="page-desc">{t('activity.desc')}</p>
      </header>

      {/* Connection status card */}
      <section className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <StatusIcon
              size={18}
              style={{ color: statusColor, animation: status === 'connecting' ? 'spin 1s linear infinite' : 'none' }}
            />
            <span style={{ fontWeight: 500, color: statusColor }}>
              {status === 'connected' ? (t('activity.wsConnected') || 'WebSocket Connected') :
               status === 'connecting' ? (t('activity.wsConnecting') || 'Connecting…') :
               (t('activity.wsDisconnected') || 'Disconnected – retrying…')}
            </span>
          </div>
          {entries.length > 0 && (
            <button className="btn" onClick={clear} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
              <Trash2 size={13} />
              {t('activity.clear') || 'Clear log'}
            </button>
          )}
        </div>
      </section>

      {/* Log entries */}
      <section className="card">
        {entries.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0' }}>
            {t('activity.empty')}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {entries.map(entry => {
              const Icon = TYPE_ICONS[entry.type]
              const color = TYPE_COLORS[entry.type]
              return (
                <div
                  key={entry.id}
                  style={{
                    display: 'flex',
                    gap: '0.75rem',
                    alignItems: 'flex-start',
                    padding: '0.625rem 0.875rem',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    borderLeft: `3px solid ${color}`
                  }}
                >
                  <Icon size={15} style={{ color, marginTop: '2px', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{entry.message}</div>
                    {entry.detail && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {entry.detail}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', flexShrink: 0 }}>
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
