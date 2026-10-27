import { useState } from 'react'
import { useTranslation } from 'react-i18next'

export function TextShare() {
  const { t } = useTranslation()
  const [text, setText] = useState('')
  const [sent, setSent] = useState(false)

  function send() {
    if (!text.trim()) return
    // For now just local feedback
    setSent(true)
    setTimeout(() => setSent(false), 2000)
  }

  function copy() {
    navigator.clipboard.writeText(text)
  }

  return (
    <section className="card">
      <h2>{t('text.title')}</h2>
      <p>{t('text.desc')}</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t('text.placeholder')}
        style={{ width: '100%', marginTop: '1rem', minHeight: '120px', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontFamily: 'inherit', resize: 'vertical' }}
      />
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
        <button onClick={send} disabled={!text.trim()}>{t('text.send')}</button>
        <button onClick={copy} disabled={!text.trim()}>{t('text.copy')}</button>
        <button onClick={() => setText('')}>{t('text.clear')}</button>
      </div>
      {sent && <div style={{ marginTop: '0.75rem', color: 'var(--success)' }}>{t('text.sent')}</div>}
    </section>
  )
}
