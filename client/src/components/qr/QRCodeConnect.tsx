import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { useTranslation } from 'react-i18next'
import { createQRPair } from '../../services/api'
import { RefreshCw, Loader } from 'lucide-react'

interface QRSession {
  sessionId: string
  code: string
  expiresAt: number
  qrUrl: string
}

export function QRCodeConnect() {
  const { t } = useTranslation()
  const [session, setSession] = useState<QRSession | null>(null)
  const [countdown, setCountdown] = useState(120)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function generate() {
    setLoading(true)
    setError('')
    try {
      const data = await createQRPair()
      if (!data.qrUrl) throw new Error('no_url')
      setSession(data as QRSession)
      setCountdown(Math.round((data.expiresAt - Date.now()) / 1000))
    } catch {
      setError(t('qr.errorGenerate') || 'Failed to generate QR code')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    generate()
  }, [])

  useEffect(() => {
    if (countdown <= 0) {
      generate()
      return
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  const percent = Math.max(0, (countdown / 120) * 100)
  const urgentColor = countdown <= 20 ? 'var(--error)' : countdown <= 40 ? 'var(--warning)' : 'var(--primary)'

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h2 className="card-title">{t('qr.title')}</h2>
          <p className="card-desc">{t('qr.desc')}</p>
        </div>
      </div>

      {error && (
        <div style={{ marginTop: '1rem', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'rgba(239,68,68,0.1)', color: 'var(--error)', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {loading && !session && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          <Loader size={32} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      )}

      {session && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', marginTop: '1.25rem' }}>
          {/* QR Code */}
          <div style={{ padding: '1rem', background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', position: 'relative' }}>
            <QRCodeSVG value={session.qrUrl} size={220} />
          </div>

          {/* Manual code */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>{t('qr.orManualCode') || 'Or enter manually:'}</div>
            <div style={{ fontSize: '2.25rem', letterSpacing: '0.6rem', fontWeight: 'bold', fontFamily: 'monospace', color: 'var(--text-primary)' }}>
              {session.code}
            </div>
          </div>

          {/* Countdown ring */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
            <div style={{ width: '100%', maxWidth: '220px', height: '6px', background: 'var(--bg-secondary)', borderRadius: '9999px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${percent}%`, background: urgentColor, borderRadius: '9999px', transition: 'width 1s linear, background 0.5s' }} />
            </div>
            <div style={{ color: urgentColor, fontSize: '0.8rem', fontVariantNumeric: 'tabular-nums' }}>
              {countdown}s
            </div>
          </div>

          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textAlign: 'center', maxWidth: '280px' }}>
            {t('qr.scan')}
          </div>

          <button className="btn" onClick={generate} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <RefreshCw size={14} />
            {t('qr.refresh')}
          </button>
        </div>
      )}
    </section>
  )
}
