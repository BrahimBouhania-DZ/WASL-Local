import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { verifyPairing } from '../services/api'
import { detectCurrentDevice } from '../utils/deviceDetector'
import { CheckCircle2, XCircle, Loader } from 'lucide-react'

export function QRPairPage() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const code = params.get('code')
  const sessionId = params.get('sid') ?? undefined
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    async function pair() {
      if (!code) {
        setStatus('error')
        setMsg('missing')
        return
      }
      try {
        const detected = detectCurrentDevice()
        const res = await verifyPairing(code, sessionId, detected.name, detected.type)
        if (res.ok) {
          setStatus('ok')
          // Store pairing info for this phone session
          localStorage.setItem('linkdesk_device_id', res.deviceId || '')
          localStorage.setItem('linkdesk_session_id', res.sessionId || '')
          localStorage.setItem('linkdesk_device_name', res.device?.name || detected.name)
          localStorage.setItem('linkdesk_device_type', detected.type)
          if (res.device?.token) {
            localStorage.setItem('linkdesk_auth_token', res.device.token)
          }
          setTimeout(() => navigate('/'), 1500)
        } else {
          setStatus('error')
          setMsg(res.reason || 'unknown')
        }
      } catch {
        setStatus('error')
        setMsg('error')
      }
    }
    pair()
  }, [code, sessionId, navigate])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'var(--bg-primary)' }}>
      <section className="card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
        <img
          src="/wasl-logo.png"
          alt="WASL Local"
          style={{ width: '72px', height: '72px', borderRadius: '16px', margin: '0 auto 1rem', boxShadow: '0 8px 24px rgba(0, 212, 255, 0.25)' }}
        />
        <h2 className="card-title" style={{ marginBottom: '0.25rem', fontSize: '1.4rem' }}>WASL Local</h2>
        <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, marginBottom: '0.5rem' }}>وَصْل • اقتران فوري آمن</div>
        <p className="card-desc" style={{ marginBottom: '1.5rem' }}>{t('qr.pairingDesc')}</p>

        <div style={{ padding: '2rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', marginBottom: '1.5rem' }}>
          {status === 'loading' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}>
              <Loader size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
              <span>{t('qr.connecting')}</span>
            </div>
          )}
          {status === 'ok' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', color: 'var(--success)' }}>
              <CheckCircle2 size={40} />
              <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>{t('qr.success')}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {t('qr.redirecting') || 'Redirecting…'}
              </span>
            </div>
          )}
          {status === 'error' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', color: 'var(--error)' }}>
              <XCircle size={40} />
              <span style={{ fontWeight: 600 }}>{t(`pairing.errors.${msg}`) || t('qr.failed') || msg}</span>
              <button className="btn" onClick={() => window.location.reload()} style={{ marginTop: '0.5rem' }}>
                {t('qr.retry') || 'Try again'}
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
