import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { sendText, getTextHistory } from '../../services/api'
import { useWs } from '../../context/WsContext'
import { useActivity } from '../../context/ActivityContext'
import { useToast } from '../../context/ToastContext'
import { useTarget } from '../../context/TargetContext'
import { DeviceSelector } from '../../components/common/DeviceSelector'
import { Send, Copy, ExternalLink, Check } from 'lucide-react'

import { copyTextToClipboard } from '../../utils/clipboardHelper'

interface TextMessage {
  id: string
  text: string
  from: string
  fromType: 'pc' | 'phone'
  timestamp: number
  isUrl?: boolean
  senderDeviceId?: string
  targetDeviceIds?: string[]
}

export function TextShare() {
  const { t } = useTranslation()
  const { subscribe } = useWs()
  const { log } = useActivity()
  const { success, info } = useToast()
  const { selectedTargetIds } = useTarget()

  const [text, setText] = useState('')
  const [messages, setMessages] = useState<TextMessage[]>([])
  const [sending, setSending] = useState(false)
  const [copied, setCopied] = useState('')

  const loadHistory = useCallback(async () => {
    try {
      const res = await getTextHistory()
      setMessages(res.messages || [])
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    loadHistory()
    const unsubscribe = subscribe((msg) => {
      if (msg.type === 'text:new' && msg.message) {
        setMessages((prev) => [msg.message, ...prev].slice(0, 100))
        log('text', `New message from ${msg.message.from}`, msg.message.text.slice(0, 60))
        info(`رسالة جديدة من ${msg.message.from}: ${msg.message.text.slice(0, 50)}...`, {
          label: 'نسخ',
          onClick: async () => {
            const ok = await copyTextToClipboard(msg.message.text)
            if (ok) success('تم نسخ النص')
          }
        })
      }
    })
    return unsubscribe
  }, [loadHistory, subscribe, log, info, success])

  async function handleSend() {
    const trimmed = text.trim()
    if (!trimmed) return
    setSending(true)
    try {
      const myDeviceName = localStorage.getItem('linkdesk_device_name') || 'PC'
      const myDeviceType = (localStorage.getItem('linkdesk_device_type') || 'pc') as 'pc' | 'phone'
      const res = await sendText(trimmed, myDeviceName, myDeviceType, selectedTargetIds)
      if (res.ok) {
        setText('')
        setMessages((prev) => [res.message, ...prev].slice(0, 100))
        log('text', `${t('text.send')}: ${trimmed.slice(0, 40)}`)
        success('تم إرسال النص بنجاح')
      }
    } catch {
      /* ignore */
    } finally {
      setSending(false)
    }
  }

  async function copyText(str: string, id: string) {
    const ok = await copyTextToClipboard(str)
    if (ok) {
      setCopied(id)
      success('تم نسخ النص إلى الحافظة')
      setTimeout(() => setCopied(''), 1500)
    } else {
      success('يرجى تحديد النص ونسخه يدوياً')
    }
  }

  return (
    <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h2 className="card-title">{t('text.title')}</h2>
        <p className="card-desc">{t('text.desc')}</p>
      </div>

      {/* Target Device Selection */}
      <DeviceSelector disabled={sending} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <textarea
          className="textarea"
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('text.placeholder')}
          style={{ resize: 'vertical' }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSend()
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Ctrl + Enter للإرسال السريع</span>
          <button
            className="btn btn-primary"
            onClick={handleSend}
            disabled={sending || !text.trim()}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Send size={15} />
            {sending ? '...' : t('text.send')}
          </button>
        </div>
      </div>

      {/* Message history */}
      <div>
        <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem' }}>{t('text.history')}</div>
        {messages.length === 0 ? (
          <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1.5rem 0', fontSize: '0.85rem' }}>
            {t('files.empty')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '380px', overflowY: 'auto' }}>
            {messages.map((m) => {
              const isMine = m.senderDeviceId === (localStorage.getItem('linkdesk_device_id') || '')
              return (
                <div
                  key={m.id}
                  style={{
                    padding: '0.75rem',
                    background: isMine ? 'rgba(0, 212, 255, 0.08)' : 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${isMine ? 'rgba(0, 212, 255, 0.25)' : 'var(--border)'}`,
                    alignSelf: isMine ? 'flex-start' : 'flex-end',
                    maxWidth: '85%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <span style={{ fontWeight: 600, color: isMine ? 'var(--primary)' : 'var(--success)' }}>
                      {isMine ? 'أنت (هذا الجهاز)' : `📥 من: ${m.from}`}
                    </span>
                    <span>{new Date(m.timestamp).toLocaleTimeString()}</span>
                  </div>

                  <div style={{ fontSize: '0.9rem', wordBreak: 'break-word', whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>
                    {m.text}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', alignSelf: 'flex-end', marginTop: '0.2rem' }}>
                    {m.isUrl && (
                      <a
                        href={m.text}
                        target="_blank"
                        rel="noreferrer"
                        className="btn"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <ExternalLink size={13} />
                        فتح
                      </a>
                    )}
                    <button
                      className="btn"
                      onClick={() => copyText(m.text, m.id)}
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      {copied === m.id ? <Check size={13} color="var(--success)" /> : <Copy size={13} />}
                      {copied === m.id ? 'تم' : t('text.copy')}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
