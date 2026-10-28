import { useState, useRef, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Monitor, Smartphone, Play, Square, Maximize, RefreshCw, AlertCircle, Wifi } from 'lucide-react'
import { useWs } from '../../context/WsContext'
import { useActivity } from '../../context/ActivityContext'

import { detectCurrentDevice } from '../../utils/deviceDetector'

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
}

export function ScreenShare() {
  const { t } = useTranslation()
  const { send, subscribe } = useWs()
  const { log } = useActivity()

  const deviceInfo = useRef(detectCurrentDevice()).current
  const isMobile = deviceInfo.type === 'phone'

  // If opening on mobile, default to 'view' (watching PC screen)
  const [mode, setMode] = useState<'broadcast' | 'view'>(() => (isMobile ? 'view' : 'broadcast'))
  const [streaming, setStreaming] = useState(false)
  const [viewing, setViewing] = useState(false)
  const [remoteActive, setRemoteActive] = useState(false)
  const [error, setError] = useState('')
  const [statusMsg, setStatusMsg] = useState('')

  // Sender refs
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const senderPcRef = useRef<RTCPeerConnection | null>(null)

  // Receiver refs
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const receiverPcRef = useRef<RTCPeerConnection | null>(null)

  // ── Broadcaster: Stop sharing ──────────────────────────────
  const stopBroadcast = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((trk) => trk.stop())
      localStreamRef.current = null
    }
    if (senderPcRef.current) {
      senderPcRef.current.close()
      senderPcRef.current = null
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null
    }
    setStreaming(false)
    send({ type: 'signal:status', payload: { active: false } })
    log('info', 'Screen broadcast stopped')
  }, [send, log])

  // ── Broadcaster: Start sharing screen ──────────────────────
  const startBroadcast = async () => {
    setError('')
    setStatusMsg('')
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        if (isMobile) {
          throw new Error('متصفحات الهواتف تمنع بث الشاشة مباشرة عبر الويب. لمشاهدة شاشة حاسوبك على هاتفك، انتقل إلى تبويب "مشاهدة شاشة الحاسوب".')
        } else {
          throw new Error('خاصية مشاركة الشاشة تتطلب متصفحاً حديثاً أو اتصال HTTPS مشفر.')
        }
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 30, max: 60 } } as any,
        audio: false
      })

      localStreamRef.current = stream
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
        localVideoRef.current.play().catch(() => {})
      }

      setStreaming(true)
      log('info', 'Screen broadcast started')

      // Listen for stream ended via browser stop-share button
      stream.getVideoTracks()[0].onended = () => {
        stopBroadcast()
      }

      // Notify viewers that stream is active
      send({ type: 'signal:status', payload: { active: true } })

      // Create Peer Connection for broadcaster
      const pc = new RTCPeerConnection(RTC_CONFIG)
      senderPcRef.current = pc

      stream.getTracks().forEach((track) => pc.addTrack(track, stream))

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          send({ type: 'signal:ice', payload: event.candidate })
        }
      }

      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      send({ type: 'signal:offer', payload: offer })
      setStatusMsg('Broadcasting offer sent… waiting for viewers')
    } catch (err: any) {
      setError(err.message || t('screen.error'))
      setStreaming(false)
    }
  }

  // ── Receiver: Disconnect viewer ────────────────────────────
  const stopViewing = useCallback(() => {
    if (receiverPcRef.current) {
      receiverPcRef.current.close()
      receiverPcRef.current = null
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null
    }
    setViewing(false)
    setStatusMsg('')
  }, [])

  // ── Receiver: Connect & accept stream ──────────────────────
  const startViewing = async (offerDesc?: RTCSessionDescriptionInit) => {
    setError('')
    setStatusMsg('Connecting to stream…')
    try {
      const pc = new RTCPeerConnection(RTC_CONFIG)
      receiverPcRef.current = pc

      pc.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0]
          remoteVideoRef.current.play().catch(() => {})
          setViewing(true)
          setStatusMsg('Stream connected!')
          log('info', 'Connected to remote screen broadcast')
        }
      }

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          send({ type: 'signal:ice', payload: event.candidate })
        }
      }

      if (offerDesc) {
        await pc.setRemoteDescription(new RTCSessionDescription(offerDesc))
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        send({ type: 'signal:answer', payload: answer })
      } else {
        // Request the broadcaster to re-send offer
        send({ type: 'signal:status', payload: { requestOffer: true } })
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect stream')
      stopViewing()
    }
  }

  // ── WebSocket signaling subscription ────────────────────────
  useEffect(() => {
    const unsubscribe = subscribe(async (msg) => {
      // 1. Broadcaster receives Answer from viewer
      if (msg.type === 'signal:answer' && senderPcRef.current) {
        try {
          if (msg.payload) {
            await senderPcRef.current.setRemoteDescription(new RTCSessionDescription(msg.payload))
            setStatusMsg('Viewer connected!')
          }
        } catch (e: any) {
          console.error('Error setting remote description on sender:', e)
        }
      }

      // 2. Receiver receives Offer from broadcaster
      if (msg.type === 'signal:offer') {
        setRemoteActive(true)
        if (mode === 'view' && !viewing) {
          startViewing(msg.payload)
        }
      }

      // 3. ICE Candidate exchange
      if (msg.type === 'signal:ice' && msg.payload) {
        const candidate = new RTCIceCandidate(msg.payload)
        try {
          if (mode === 'broadcast' && senderPcRef.current) {
            await senderPcRef.current.addIceCandidate(candidate)
          } else if (mode === 'view' && receiverPcRef.current) {
            await receiverPcRef.current.addIceCandidate(candidate)
          }
        } catch (e) {
          /* ignore candidate race */
        }
      }

      // 4. Status updates (active stream or viewer requesting new offer)
      if (msg.type === 'signal:status' && msg.payload) {
        if (typeof msg.payload.active === 'boolean') {
          setRemoteActive(msg.payload.active)
          if (!msg.payload.active && viewing) {
            stopViewing()
          }
        }
        if (msg.payload.requestOffer && streaming && senderPcRef.current) {
          // Re-create offer for new joiner
          try {
            const offer = await senderPcRef.current.createOffer()
            await senderPcRef.current.setLocalDescription(offer)
            send({ type: 'signal:offer', payload: offer })
          } catch (e) {}
        }
      }
    })

    return () => {
      unsubscribe()
    }
  }, [subscribe, send, mode, viewing, streaming, stopViewing])

  // When entering view mode, query for existing broadcast
  useEffect(() => {
    if (mode === 'view') {
      send({ type: 'signal:status', payload: { requestOffer: true } })
    }
  }, [mode, send])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopBroadcast()
      stopViewing()
    }
  }, [stopBroadcast, stopViewing])

  const toggleFullscreen = (video: HTMLVideoElement | null) => {
    if (!video) return
    if (!document.fullscreenElement) {
      video.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Mode Switch Tabs */}
      <div style={{ display: 'flex', gap: '0.75rem', background: 'var(--bg-secondary)', padding: '0.35rem', borderRadius: 'var(--radius-md)', width: 'fit-content' }}>
        <button
          className="btn"
          style={{
            background: mode === 'broadcast' ? 'var(--primary)' : 'transparent',
            color: mode === 'broadcast' ? '#fff' : 'var(--text-secondary)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem'
          }}
          onClick={() => setMode('broadcast')}
        >
          <Monitor size={18} />
          {isMobile ? 'بث الشاشة (للحاسوب)' : (t('screen.broadcastTab') || 'بث شاشتي')}
        </button>

        <button
          className="btn"
          style={{
            background: mode === 'view' ? 'var(--primary)' : 'transparent',
            color: mode === 'view' ? '#fff' : 'var(--text-secondary)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            position: 'relative'
          }}
          onClick={() => setMode('view')}
        >
          <Smartphone size={18} />
          {isMobile ? 'مشاهدة شاشة الحاسوب' : (t('screen.viewerTab') || 'مشاهدة البث')}
          {remoteActive && (
            <span
              style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--success)',
                marginLeft: '0.25rem'
              }}
            />
          )}
        </button>
      </div>

      {/* Broadcaster Section */}
      {mode === 'broadcast' && (
        <section className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Monitor size={22} color="var(--primary)" />
                {t('screen.title')}
              </h2>
              <p className="card-desc">{t('screen.desc')}</p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              {!streaming ? (
                <button className="btn btn-primary" onClick={startBroadcast} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Play size={18} />
                  {t('screen.start')}
                </button>
              ) : (
                <button className="btn btn-danger" onClick={stopBroadcast} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Square size={18} />
                  {t('screen.stop')}
                </button>
              )}
            </div>
          </div>

          {statusMsg && (
            <div style={{ padding: '0.6rem 1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: 'var(--primary)', marginBottom: '1rem' }}>
              {statusMsg}
            </div>
          )}

          {error && (
            <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {streaming ? (
            <div style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: '#000', border: '1px solid var(--border)' }}>
              <video ref={localVideoRef} style={{ width: '100%', maxHeight: '480px', display: 'block', background: '#000' }} muted playsInline />
              <div style={{ position: 'absolute', bottom: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn"
                  onClick={() => toggleFullscreen(localVideoRef.current)}
                  style={{ background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', padding: '0.4rem 0.6rem' }}
                >
                  <Maximize size={18} />
                </button>
              </div>
            </div>
          ) : (
            <div style={{ padding: '3rem 1.5rem', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', color: 'var(--text-secondary)' }}>
              <Monitor size={48} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
              <p>{t('screen.browserWarning') || 'اضغط على زر بدء المشاركة لاختيار الشاشة أو النافذة المراد بثها للمتصلين عبر WebRTC'}</p>
            </div>
          )}
        </section>
      )}

      {/* Receiver / Viewer Section */}
      {mode === 'view' && (
        <section className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Smartphone size={22} color="var(--primary)" />
                {t('screen.viewerTab') || 'مشاهدة البث المباشر'}
              </h2>
              <p className="card-desc">
                {remoteActive ? (
                  <span style={{ color: 'var(--success)', fontWeight: 600 }}>● {t('screen.live') || 'بث مباشر نشط الآن من الحاسوب'}</span>
                ) : (
                  <span>{t('screen.waitingStream') || 'في انتظار بدء البث من الحاسوب...'}</span>
                )}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              {remoteActive && !viewing && (
                <button className="btn btn-primary" onClick={() => startViewing()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Play size={18} />
                  {t('screen.connectStream') || 'مشاهدة البث'}
                </button>
              )}
              {viewing && (
                <button className="btn btn-danger" onClick={stopViewing} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Square size={18} />
                  {t('screen.disconnectStream') || 'قطع الاتصال'}
                </button>
              )}
            </div>
          </div>

          {statusMsg && (
            <div style={{ padding: '0.6rem 1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: 'var(--primary)', marginBottom: '1rem' }}>
              {statusMsg}
            </div>
          )}

          {error && (
            <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: '#000', border: '1px solid var(--border)', minHeight: viewing ? '300px' : '200px' }}>
            <video
              ref={remoteVideoRef}
              style={{
                width: '100%',
                maxHeight: '600px',
                display: viewing ? 'block' : 'none',
                background: '#000'
              }}
              autoPlay
              playsInline
            />
            {viewing && (
              <div style={{ position: 'absolute', bottom: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn"
                  onClick={() => toggleFullscreen(remoteVideoRef.current)}
                  style={{ background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', padding: '0.4rem 0.6rem' }}
                >
                  <Maximize size={18} />
                </button>
              </div>
            )}
            {!viewing && (
              <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                {remoteActive ? (
                  <div>
                    <RefreshCw size={36} style={{ animation: 'spin 2s linear infinite', color: 'var(--primary)', marginBottom: '1rem' }} />
                    <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t('screen.live') || 'بث مباشر متاح!'}</p>
                    <button className="btn btn-primary" onClick={() => startViewing()} style={{ marginTop: '1rem' }}>
                      {t('screen.connectStream') || 'انقر لمشاهدة البث الآن'}
                    </button>
                  </div>
                ) : (
                  <div>
                    <Wifi size={40} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                    <p>{t('screen.waitingStream') || 'لا يوجد بث نشط حالياً. ابدأ البث من الحاسوب ليظهر هنا فوراً.'}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
