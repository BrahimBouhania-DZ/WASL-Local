import { useState, useRef, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { listFiles, getDownloadUrl, deleteFile, uploadFilesWithProgress, UploadProgress } from '../../services/api'
import { useWs } from '../../context/WsContext'
import { useActivity } from '../../context/ActivityContext'
import { useToast } from '../../context/ToastContext'
import { useTarget } from '../../context/TargetContext'
import { DeviceSelector } from '../../components/common/DeviceSelector'
import {
  UploadCloud,
  Download,
  Trash2,
  FileIcon,
  Eye,
  Zap,
  Inbox,
  Send,
  Sparkles
} from 'lucide-react'

interface FileMeta {
  id: string
  originalName: string
  savedName: string
  size: number
  uploadedAt: number
  extension: string
  senderName?: string
  senderDeviceId?: string
  targetDeviceIds?: string[]
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function formatSpeed(bytesPerSec: number) {
  if (bytesPerSec < 1024 * 1024) {
    return `${(bytesPerSec / 1024).toFixed(0)} KB/s`
  }
  return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`
}

export function Files() {
  const { t } = useTranslation()
  const { subscribe } = useWs()
  const { log } = useActivity()
  const { success, error: toastError, info } = useToast()
  const { selectedTargetIds } = useTarget()

  // Tabs: 'send' (Upload to others) vs 'receive' (Received files on this device)
  const [activeTab, setActiveTab] = useState<'send' | 'receive'>('send')

  const [uploadFiles, setUploadFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<UploadProgress | null>(null)
  const [serverFiles, setServerFiles] = useState<FileMeta[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [previewFile, setPreviewFile] = useState<FileMeta | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const myDeviceId = localStorage.getItem('linkdesk_device_id') || ''
  const myDeviceName = localStorage.getItem('linkdesk_device_name') || 'This Device'

  const loadFiles = useCallback(async () => {
    setLoadingList(true)
    try {
      const res = await listFiles()
      setServerFiles(res.files || [])
    } catch {
      /* silently ignore */
    } finally {
      setLoadingList(false)
    }
  }, [])

  useEffect(() => {
    loadFiles()
    const unsubscribe = subscribe((msg) => {
      if (msg.type === 'files:new') {
        const file = msg.file as FileMeta
        setServerFiles((prev) => [file, ...prev.filter((f) => f.savedName !== file.savedName)])
        log('file', `New file received: ${file.originalName}`, formatSize(file.size))

        // If file was sent by someone else to me, auto switch to receive view with celebratory toast
        if (file.senderDeviceId !== myDeviceId) {
          setActiveTab('receive')
          success(`وصلك ملف جديد من ${file.senderName || 'جهاز متصل'}: ${file.originalName}`, {
            label: 'تحميل مباشر',
            onClick: () => {
              window.open(getDownloadUrl(file.savedName), '_blank')
            }
          })
        }
      }
      if (msg.type === 'files:delete') {
        setServerFiles((prev) => prev.filter((f) => f.savedName !== msg.savedName))
      }
    })
    return unsubscribe
  }, [loadFiles, subscribe, log, success, myDeviceId])

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setUploadFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)])
  }

  function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setUploadFiles((prev) => [...prev, ...Array.from(e.target.files!)])
    }
  }

  async function upload() {
    if (uploadFiles.length === 0) return
    setUploading(true)
    setProgress({ percent: 0, loaded: 0, total: 0, speedBytesPerSec: 0 })

    try {
      const data = await uploadFilesWithProgress(
        uploadFiles,
        selectedTargetIds,
        (p) => setProgress(p)
      )

      if (data.ok) {
        success(`تم إرسال ${uploadFiles.length} ملف بنجاح وبسرعة فائقة`)
        uploadFiles.forEach((f) => log('file', `${t('files.upload')}: ${f.name}`, formatSize(f.size)))
        setUploadFiles([])
        loadFiles()
      } else {
        toastError(data.error ? t(`files.errors.${data.error}`) || data.error : t('files.failed'))
      }
    } catch (err: any) {
      toastError(err?.message || t('files.failed'))
    } finally {
      setUploading(false)
      setProgress(null)
    }
  }

  async function handleDelete(file: FileMeta) {
    await deleteFile(file.savedName)
    log('file', `Deleted: ${file.originalName}`)
    setServerFiles((prev) => prev.filter((f) => f.savedName !== file.savedName))
    info(`تم حذف ${file.originalName}`)
  }

  const isImage = (ext: string) => ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext.toLowerCase())

  // Files received specifically for this device or broadcasted by others
  const receivedFiles = serverFiles.filter((f) => f.senderDeviceId !== myDeviceId)
  // Files sent by this device
  const sentFiles = serverFiles.filter((f) => f.senderDeviceId === myDeviceId)

  return (
    <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header with clear identity badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {t('files.title')}
          </h2>
          <p className="card-desc">{t('files.desc')}</p>
        </div>

        {/* Current Device Identity Badge */}
        <div style={{ padding: '0.35rem 0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-full, 9999px)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }} />
          <span style={{ color: 'var(--text-secondary)' }}>أنت الآن:</span>
          <strong style={{ color: 'var(--primary)' }}>{myDeviceName}</strong>
        </div>
      </div>

      {/* Role Toggle Tabs: Sender View vs Receiver View */}
      <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.3rem', borderRadius: 'var(--radius-md)', width: 'fit-content' }}>
        <button
          type="button"
          onClick={() => setActiveTab('send')}
          className="btn"
          style={{
            background: activeTab === 'send' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'send' ? '#fff' : 'var(--text-secondary)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.45rem 1rem',
            fontSize: '0.875rem'
          }}
        >
          <Send size={16} />
          <span>إرسال ملفات (وضع المرسل)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('receive')}
          className="btn"
          style={{
            background: activeTab === 'receive' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'receive' ? '#fff' : 'var(--text-secondary)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.45rem 1rem',
            fontSize: '0.875rem',
            position: 'relative'
          }}
        >
          <Inbox size={16} />
          <span>الملفات المستلمة (وضع المستقبل)</span>
          {receivedFiles.length > 0 && (
            <span
              style={{
                background: activeTab === 'receive' ? '#fff' : 'var(--primary)',
                color: activeTab === 'receive' ? 'var(--primary)' : '#fff',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '0.1rem 0.45rem',
                borderRadius: '9999px',
                marginLeft: '0.25rem'
              }}
            >
              {receivedFiles.length}
            </span>
          )}
        </button>
      </div>

      {/* ── SENDER VIEW ────────────────────────────────────────── */}
      {activeTab === 'send' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Target Device Selection */}
          <DeviceSelector disabled={uploading} />

          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
            style={{
              padding: '2.5rem 1.5rem',
              border: '2px dashed var(--border)',
              borderRadius: 'var(--radius-lg)',
              textAlign: 'center',
              background: 'var(--bg-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.6rem'
            }}
          >
            <input ref={inputRef} type="file" multiple onChange={handleSelect} style={{ display: 'none' }} />
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <UploadCloud size={24} />
            </div>
            <div style={{ fontWeight: 600 }}>{t('files.drop')}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{t('files.orClick')}</div>
          </div>

          {/* Upload Queue Card */}
          {uploadFiles.length > 0 && (
            <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <span>{t('files.selected')}: {uploadFiles.length}</span>
                <span>{formatSize(uploadFiles.reduce((acc, f) => acc + f.size, 0))}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '160px', overflowY: 'auto' }}>
                {uploadFiles.map((f, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '0.45rem 0.75rem',
                      background: 'var(--bg-primary)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.85rem',
                      border: '1px solid var(--border)'
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>{f.name}</span>
                    <span style={{ color: 'var(--text-secondary)', flexShrink: 0 }}>{formatSize(f.size)}</span>
                  </div>
                ))}
              </div>

              {/* Streaming Progress */}
              {uploading && progress && (
                <div style={{ marginTop: '1rem', padding: '0.85rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--primary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)' }}>
                      <Zap size={15} />
                      {t('files.uploading')} ({progress.percent}%)
                    </span>
                    <span style={{ color: 'var(--success)' }}>{formatSpeed(progress.speedBytesPerSec)}</span>
                  </div>

                  <div style={{ height: '8px', background: 'var(--bg-secondary)', borderRadius: '9999px', overflow: 'hidden', marginBottom: '0.4rem' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${progress.percent}%`,
                        background: 'linear-gradient(90deg, var(--primary), var(--success))',
                        borderRadius: '9999px',
                        transition: 'width 0.1s linear'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <span>{formatSize(progress.loaded)} / {formatSize(progress.total)}</span>
                    <span>نقل فائق السرعة عبر الذاكرة المؤقتة</span>
                  </div>
                </div>
              )}

              {!uploading && (
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                  <button
                    className="btn btn-primary"
                    onClick={upload}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, justifyContent: 'center' }}
                  >
                    <UploadCloud size={16} />
                    {t('files.upload')}
                  </button>
                  <button
                    className="btn"
                    onClick={() => setUploadFiles([])}
                    style={{ padding: '0.5rem 1rem' }}
                  >
                    إلغاء
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Sent History by this device */}
          {sentFiles.length > 0 && (
            <div style={{ marginTop: '0.5rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                ملفات قمت بإرسالها مؤخراً ({sentFiles.length}):
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '180px', overflowY: 'auto' }}>
                {sentFiles.map((f) => (
                  <div
                    key={f.savedName}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.45rem 0.75rem',
                      background: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.8rem'
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>{f.originalName}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{formatSize(f.size)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── RECEIVER VIEW ──────────────────────────────────────── */}
      {activeTab === 'receive' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Sparkles size={18} color="var(--primary)" />
              الملفات الواصلة إلى هذا الجهاز ({serverFiles.length})
            </h3>
            <button className="btn" onClick={loadFiles} disabled={loadingList} style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}>
              {t('devices.refresh')}
            </button>
          </div>

          {serverFiles.length === 0 ? (
            <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '3rem 1.5rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
              <Inbox size={48} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
              <p style={{ fontWeight: 500 }}>{t('files.empty') || 'لم يتم استلام أي ملفات بعد'}</p>
              <span style={{ fontSize: '0.8rem' }}>بمجرد أن يرسل جهاز آخر ملفاً إليك، سيظهر هنا فوراً مع زر التنزيل والمعاينة</span>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
              {serverFiles.map((f) => (
                <div
                  key={f.savedName}
                  style={{
                    padding: '0.85rem',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    transition: 'border-color 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                      <FileIcon size={20} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }} title={f.originalName}>
                        {f.originalName}
                      </div>

                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                        <span>{formatSize(f.size)}</span> &middot; <span>{new Date(f.uploadedAt).toLocaleTimeString()}</span>
                      </div>

                      {f.senderName && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: '0.25rem', fontWeight: 500 }}>
                          مرسل من: {f.senderName}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions for receiver: Fast Download & Preview */}
                  <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '0.6rem' }}>
                    {isImage(f.extension) && (
                      <button
                        className="btn"
                        onClick={() => setPreviewFile(f)}
                        style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <Eye size={14} />
                        معاينة
                      </button>
                    )}

                    <a
                      href={getDownloadUrl(f.savedName)}
                      download={f.originalName}
                      className="btn btn-primary"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem', flex: 1, justifyContent: 'center' }}
                    >
                      <Download size={14} />
                      تحميل فوري
                    </a>

                    <button
                      className="btn"
                      onClick={() => handleDelete(f)}
                      style={{ padding: '0.35rem 0.5rem', color: 'var(--error)' }}
                      title="حذف"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Image Preview Modal */}
      {previewFile && (
        <div
          onClick={() => setPreviewFile(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10001,
            padding: '1rem',
            cursor: 'pointer'
          }}
        >
          <div style={{ maxWidth: '90vw', maxHeight: '90vh', background: 'var(--bg-primary)', padding: '0.75rem', borderRadius: 'var(--radius-lg)' }}>
            <img
              src={getDownloadUrl(previewFile.savedName)}
              alt={previewFile.originalName}
              style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', display: 'block', borderRadius: '6px' }}
            />
            <div style={{ padding: '0.75rem 0.5rem 0.25rem', textAlign: 'center', fontWeight: 600, fontSize: '0.9rem' }}>{previewFile.originalName}</div>
          </div>
        </div>
      )}
    </section>
  )
}
