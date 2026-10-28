import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { syncClipboard, getLatestClipboard } from '../../services/api'
import { useWs } from '../../context/WsContext'
import { useActivity } from '../../context/ActivityContext'
import { useToast } from '../../context/ToastContext'
import { useTarget } from '../../context/TargetContext'
import { DeviceSelector } from '../../components/common/DeviceSelector'
import { ClipboardCopy, ClipboardPaste, RefreshCw } from 'lucide-react'

import { copyTextToClipboard, readTextFromClipboard } from '../../utils/clipboardHelper'

export function Clipboard() {
  const { t } = useTranslation()
  const { subscribe } = useWs()
  const { log } = useActivity()
  const { success, info, warning } = useToast()
  const { selectedTargetIds } = useTarget()

  const [text, setText] = useState('')
  const [remoteClipboard, setRemoteClipboard] = useState<{ text: string; from: string; updatedAt: number } | null>(null)
  const [syncing, setSyncing] = useState(false)

  const loadRemote = useCallback(async () => {
    try {
      const res = await getLatestClipboard()
      if (res.clipboard) setRemoteClipboard(res.clipboard)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    loadRemote()
    const unsubscribe = subscribe((msg) => {
      if (msg.type === 'clipboard:updated' && msg.clipboard) {
        setRemoteClipboard(msg.clipboard)
        log('clipboard', `Clipboard updated from ${msg.clipboard.from}`, msg.clipboard.text?.slice(0, 60))
        info(`وصلت حافظة جديدة من ${msg.clipboard.from}`, {
          label: 'نسخ إلى حاسوبي/هاتفي',
          onClick: async () => {
            const ok = await copyTextToClipboard(msg.clipboard.text)
            if (ok) {
              success('تم نسخ محتوى الحافظة المستلمة بنجاح')
            } else {
              warning('تعذر النسخ التلقائي، يمكنك نسخه يدوياً من الشاشة')
            }
          }
        })
      }
    })
    return unsubscribe
  }, [loadRemote, subscribe, log, info, success, warning])

  async function readLocal() {
    const content = await readTextFromClipboard()
    if (content !== null) {
      setText(content)
      success(t('clipboard.readOk'))
    } else {
      warning('يتطلب متصفح هاتفك لصق النص يدوياً داخل الحقل')
    }
  }

  async function writeLocal() {
    const ok = await copyTextToClipboard(text)
    if (ok) {
      success(t('clipboard.writeOk'))
    } else {
      warning(t('clipboard.writeDenied'))
    }
  }

  async function syncToServer() {
    if (!text.trim()) return
    setSyncing(true)
    try {
      const myDeviceName = localStorage.getItem('linkdesk_device_name') || 'PC'
      const myDeviceType = (localStorage.getItem('linkdesk_device_type') || 'pc') as 'pc' | 'phone'
      const res = await syncClipboard(text, myDeviceName, myDeviceType, selectedTargetIds)
      if (res.ok) {
        success('تمت مزامنة الحافظة مع الأجهزة المحددة بنجاح')
        log('clipboard', 'Clipboard synced', text.slice(0, 60))
      }
    } catch {
      /* ignore */
    } finally {
      setSyncing(false)
    }
  }

  return (
    <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h2 className="card-title">{t('clipboard.title')}</h2>
        <p className="card-desc">{t('clipboard.desc')}</p>
      </div>

      {/* Target Device Selection */}
      <DeviceSelector disabled={syncing} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <textarea
          className="textarea"
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('clipboard.placeholder')}
          style={{ resize: 'vertical' }}
        />

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn" onClick={readLocal} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <ClipboardPaste size={15} />
            {t('clipboard.read')}
          </button>
          <button className="btn" onClick={writeLocal} disabled={!text} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <ClipboardCopy size={15} />
            {t('clipboard.write')}
          </button>
          <button
            className="btn btn-primary"
            onClick={syncToServer}
            disabled={!text || syncing}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginLeft: 'auto' }}
          >
            <RefreshCw size={15} style={syncing ? { animation: 'spin 1s linear infinite' } : {}} />
            {t('clipboard.sync')}
          </button>
        </div>
      </div>

      {/* Remote clipboard preview */}
      {remoteClipboard && (
        <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            <span>
              {t('clipboard.remote')} <strong style={{ color: 'var(--primary)' }}>{remoteClipboard.from}</strong>
            </span>
            <span>{new Date(remoteClipboard.updatedAt).toLocaleTimeString()}</span>
          </div>
          <div style={{ fontSize: '0.875rem', wordBreak: 'break-word', whiteSpace: 'pre-wrap', maxHeight: '120px', overflowY: 'auto' }}>
            {remoteClipboard.text}
          </div>
          <button
            className="btn btn-sm"
            onClick={async () => {
              setText(remoteClipboard.text)
              const ok = await copyTextToClipboard(remoteClipboard.text)
              if (ok) {
                success('تم نسخ محتوى الحافظة بنجاح إلى هاتفك/حاسوبك')
              } else {
                warning('تم تعيين النص في الحقل أعلاه، يمكنك استخدامه')
              }
            }}
            style={{ marginTop: '0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <ClipboardCopy size={14} />
            {t('clipboard.useRemote') || 'نسخ إلى حافظتي'}
          </button>
        </div>
      )}
    </section>
  )
}
