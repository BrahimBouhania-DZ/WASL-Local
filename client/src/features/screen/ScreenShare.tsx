import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'

export function ScreenShare() {
  const { t } = useTranslation()
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  async function start() {
    setError('')
    try {
      const stream = await (navigator.mediaDevices as any).getDisplayMedia({
        video: { cursor: 'always' },
        audio: false
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setStreaming(true)
      stream.getVideoTracks()[0].onended = () => {
        stop()
      }
    } catch (e: any) {
      setError(e.message || t('screen.error'))
    }
  }

  function stop() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setStreaming(false)
  }

  return (
    <section className="card">
      <h2>{t('screen.title')}</h2>
      <p>{t('screen.desc')}</p>
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
        {!streaming ? (
          <button onClick={start}>{t('screen.start')}</button>
        ) : (
          <button onClick={stop}>{t('screen.stop')}</button>
        )}
      </div>
      {error && <div style={{ marginTop: '0.75rem', color: 'var(--error)' }}>{error}</div>}
      {streaming && (
        <div style={{ marginTop: '1rem', borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid var(--border)' }}>
          <video ref={videoRef} style={{ width: '100%', maxHeight: '400px', background: '#000' }} muted playsInline />
        </div>
      )}
    </section>
  )
}
