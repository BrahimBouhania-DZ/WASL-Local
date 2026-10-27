import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createPairing, verifyPairing } from '../../services/api'

export function Pairing() {
  const { t } = useTranslation()
  const [code, setCode] = useState('')
  const [session, setSession] = useState<any>(null)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    setLoading(true)
    try {
      const res = await createPairing()
      setSession(res)
      setResult(null)
    } catch (e) {
      setResult({ ok: false, reason: 'error' })
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify() {
    if (!code) return
    setLoading(true)
    try {
      const res = await verifyPairing(code)
      setResult(res)
      if (res.ok) setCode('')
    } catch (e) {
      setResult({ ok: false, reason: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h2 className="card-title">{t('pairing.title')}</h2>
          <p className="card-desc">{t('pairing.desc')}</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={handleCreate} disabled={loading}>
          {t('pairing.create')}
        </button>
      </div>
      {session && (
        <div style={{ marginTop: '1rem', padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', textAlign: 'center', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '2.5rem', letterSpacing: '0.8rem', fontWeight: 'bold', fontFamily: 'monospace' }}>{session.code || '------'}</div>
          <div style={{ color: 'var(--text-secondary)', marginTop: '0.75rem' }}>
            {t('pairing.expires')}
          </div>
        </div>
      )}
      <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <input
          className="input"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={t('pairing.codePlaceholder')}
          maxLength={8}
        />
        <button className="btn btn-primary" onClick={handleVerify} disabled={loading || !code}>
          {t('pairing.verify')}
        </button>
      </div>
      {result && (
        <div style={{ marginTop: '1rem', color: result.ok ? 'var(--success)' : 'var(--error)' }}>
          {result.ok ? t('pairing.success') : t(`pairing.errors.${result.reason}`) || t('pairing.failed')}
        </div>
      )}
    </section>
  )
}
