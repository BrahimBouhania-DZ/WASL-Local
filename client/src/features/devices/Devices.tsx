import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { getDevices, disconnectDevice } from '../../services/api'
import { useWs } from '../../context/WsContext'
import { useActivity } from '../../context/ActivityContext'
import { useToast } from '../../context/ToastContext'
import { Smartphone, Monitor, RefreshCw, WifiOff } from 'lucide-react'

interface Device {
  id: string
  name: string
  type: 'pc' | 'phone'
  connectedAt: number
  lastSeen: number
}

export function Devices() {
  const { t } = useTranslation()
  const { subscribe } = useWs()
  const { log } = useActivity()
  const { info } = useToast()
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(false)

  const myDeviceId = localStorage.getItem('linkdesk_device_id') || ''

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getDevices()
      setDevices(res.devices || [])
    } catch {
      setDevices([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    // Subscribe to real-time device updates via WebSocket
    const unsubscribe = subscribe((msg) => {
      if (msg.type === 'devices:update' && Array.isArray(msg.devices)) {
        setDevices(msg.devices)
        log('device', `${msg.devices.length} ${t('devices.connected') || 'device(s) connected'}`)
      }
    })
    return unsubscribe
  }, [load, subscribe, log, t])

  async function disconnect(id: string, name: string) {
    await disconnectDevice(id)
    log('device', t('devices.disconnect'), name)
    info(`تم فصل الجهاز: ${name}`)
    load()
  }

  function formatTime(ms: number) {
    return new Date(ms).toLocaleTimeString()
  }

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h2 className="card-title">{t('devices.title')}</h2>
          <p className="card-desc">{t('devices.desc')}</p>
        </div>
        <button
          className="btn"
          onClick={load}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          title={t('devices.refresh')}
        >
          <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
        {devices.length === 0 && (
          <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0', fontSize: '0.9rem' }}>
            {t('devices.empty')}
          </div>
        )}
        {devices.map((d) => {
          const isMe = d.id === myDeviceId
          const Icon = d.type === 'phone' ? Smartphone : Monitor

          return (
            <div
              key={d.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.875rem 1rem',
                background: isMe ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                borderRadius: 'var(--radius-md)',
                border: isMe ? '1px solid var(--primary)' : '1px solid var(--border)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: 'var(--radius-md)',
                    background: isMe ? 'var(--primary)' : 'var(--bg-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isMe ? '#fff' : 'var(--primary)',
                    border: '1px solid var(--border)'
                  }}
                >
                  <Icon size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span>{d.name}</span>
                    {isMe && (
                      <span
                        style={{
                          fontSize: '0.7rem',
                          background: 'rgba(59, 130, 246, 0.15)',
                          color: 'var(--primary)',
                          padding: '0.1rem 0.4rem',
                          borderRadius: '4px'
                        }}
                      >
                        (هذا الجهاز)
                      </span>
                    )}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                    {d.type === 'phone' ? 'هاتف محمول' : 'حاسوب شخصي'} &middot; متصل منذ {formatTime(d.connectedAt)}
                  </div>
                </div>
              </div>

              {!isMe && (
                <button
                  className="btn"
                  onClick={() => disconnect(d.id, d.name)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--error)' }}
                  title={t('devices.disconnect')}
                >
                  <WifiOff size={14} />
                  <span style={{ fontSize: '0.8rem' }}>{t('devices.disconnect')}</span>
                </button>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
