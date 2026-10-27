import { useState } from 'react'
import { useTranslation } from 'react-i18next'

export function Clipboard() {
  const { t } = useTranslation()
  const [text, setText] = useState('')
  const [status, setStatus] = useState('')

  async function read() {
    try {
      const t2 = await navigator.clipboard.readText()
      setText(t2)
      setStatus(t('clipboard.readOk'))
    } catch (e) {
      setStatus(t('clipboard.readDenied'))
    }
  }

  async function write() {
    try {
      await navigator.clipboard.writeText(text)
      setStatus(t('clipboard.writeOk'))
    } catch (e) {
      setStatus(t('clipboard.writeDenied'))
    }
  }

  return (
    <section className="card">
      <h2>{t('clipboard.title')}</h2>
      <p>{t('clipboard.desc')}</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t('clipboard.placeholder')}
        style={{ width: '100%', marginTop: '1rem', minHeight: '100px', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontFamily: 'inherit', resize: 'vertical' }}
      />
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
        <button onClick={read}>{t('clipboard.read')}</button>
        <button onClick={write} disabled={!text.trim()}>{t('clipboard.write')}</button>
      </div>
      {status && <div style={{ marginTop: '0.75rem', color: 'var(--text-secondary)' }}>{status}</div>}
    </section>
  )
}
