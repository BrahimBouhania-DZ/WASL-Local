import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createPairing, verifyPairing } from '../../services/api'
import { useActivity } from '../../context/ActivityContext'
import { useWs } from '../../context/WsContext'
import { KeyRound, RefreshCw, CheckCircle2, XCircle } from 'lucide-react'

interface PairingSession {
  sessionId: string
  code: string
  expiresAt: number
}

export function Pairing() {
  const { t } = useTranslation()
  const { log } = useActivity()
  const { send: wsSend } = useWs()
  const [code, setCode] = useState('')
  const [session, setSession] = useState<PairingSession | null>(null)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    setLoading(true)
    try {
      const res = await createPairing()
      setSession(res)
      setResult(null)
      log('pairing', t('pairing.create'), `Code: ${res.code}`)
    } catch {
      setResult({ ok: false, reason: 'error' })
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify() {
    if (!code.trim()) return
    setLoading(true)
    try {
      const res = await verifyPairing(code.trim(), session?.sessionId)
      setResult(res)
      if (res.ok) {
        setCode('')
        setSession(null)
        if (res.device?.token) {
          localStorage.setItem('linkdesk_auth_token', res.device.token)
        }
        log('pairing', t('pairing.success'), `Device: ${res.device?.name || 'Unknown'}`)
        wsSend({ type: 'devices:get' })
      } else {
        log('pairing', t('pairing.failed'), res.reason)
      }
    } catch {
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

      {/* Create Code Button */}
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={handleCreate} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <KeyRound size={15} />
          {t('pairing.create')}
        </button>
        {session && (
          <button className="btn" onClick={handleCreate} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <RefreshCw size={14} />
          </button>
        )}
      </div>

      {/* Code Display */}
      {session && (
        <div style={{ marginTop: '1rem', padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', textAlign: 'center', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {t('pairing.code') || 'Pairing Code'}
          </div>
          <div style={{ fontSize: '2.75rem', letterSpacing: '0.8rem', fontWeight: 'bold', fontFamily: 'monospace', color: 'var(--primary)' }}>
            {session.code}
          </div>
          <div style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.8rem' }}>
            {t('pairing.expires')}
          </div>
        </div>
      )}

      {/* Verify Input */}
      <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <input
          className="input"
          value={code}
          onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
          placeholder={t('pairing.codePlaceholder')}
          maxLength={8}
          inputMode="numeric"
          onKeyDown={e => e.key === 'Enter' && handleVerify()}
          style={{ flex: 1, minWidth: '120px' }}
        />
        <button className="btn btn-primary" onClick={handleVerify} disabled={loading || !code.trim()}>
          {t('pairing.verify')}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: result.ok ? 'var(--success)' : 'var(--error)' }}>
          {result.ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          <span>
            {result.ok
              ? t('pairing.success')
              : t(`pairing.errors.${result.reason}`) || t('pairing.failed')}
          </span>
        </div>
      )}
    </section>
  )
}
