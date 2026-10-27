import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:8080'

export function Files() {
  const { t } = useTranslation()
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const dropped = Array.from(e.dataTransfer.files)
    setFiles(prev => [...prev, ...dropped])
  }

  function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)])
    }
  }

  async function upload() {
    if (files.length === 0) return
    setUploading(true)
    setResult(null)
    try {
      const formData = new FormData()
      files.forEach(f => formData.append('files', f))
      const res = await fetch(`${API_BASE}/files/upload`, {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      setResult(data)
      if (data.ok) setFiles([])
    } catch (e) {
      setResult({ error: 'upload_failed' })
    } finally {
      setUploading(false)
    }
  }

  return (
    <section className="card">
      <h2>{t('files.title')}</h2>
      <p>{t('files.desc')}</p>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        style={{ marginTop: '1rem', padding: '2rem', border: '2px dashed var(--border)', borderRadius: '0.75rem', textAlign: 'center', background: 'var(--bg-secondary)' }}
        onClick={() => inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" multiple onChange={handleSelect} style={{ display: 'none' }} />
        <div>{t('files.drop')}</div>
        <div style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{t('files.orClick')}</div>
      </div>
      {files.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <div style={{ marginBottom: '0.75rem' }}>{t('files.selected')}: {files.length}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {files.map((f, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'var(--bg-secondary)', borderRadius: '0.5rem' }}>
                <span>{f.name}</span>
                <span style={{ color: 'var(--text-secondary)' }}>{(f.size / 1024).toFixed(1)} KB</span>
              </div>
            ))}
          </div>
          <button onClick={upload} disabled={uploading} style={{ marginTop: '1rem' }}>
            {uploading ? t('files.uploading') : t('files.upload')}
          </button>
        </div>
      )}
      {result && (
        <div style={{ marginTop: '1rem', color: result.ok ? 'var(--success)' : 'var(--error)' }}>
          {result.ok ? t('files.success') : result.reason ? t(`files.errors.${result.reason}`) : t('files.failed')}
        </div>
      )}
    </section>
  )
}
