import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getDevices, disconnectDevice } from '../../services/api'

export function Devices() {
  const { t } = useTranslation()
  const [devices, setDevices] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await getDevices()
      setDevices(res.devices || [])
    } catch (e) {
      setDevices([])
    } finally {
      setLoading(false)
    }
  }

  async function disconnect(id: string) {
    await disconnectDevice(id)
    load()
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <section className="card">
      <h2>{t('devices.title')}</h2>
      <p>{t('devices.desc')}</p>
      <button onClick={load} disabled={loading} style={{ marginTop: '1rem' }}>
        {t('devices.refresh')}
      </button>
      <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {devices.length === 0 && <div style={{ color: 'var(--text-secondary)' }}>{t('devices.empty')}</div>}
        {devices.map((d) => (
          <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '0.5rem' }}>
            <div>
              <div>{d.name}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{d.type}</div>
            </div>
            <button onClick={() => disconnect(d.id)}>{t('devices.disconnect')}</button>
          </div>
        ))}
      </div>
    </section>
  )
}
