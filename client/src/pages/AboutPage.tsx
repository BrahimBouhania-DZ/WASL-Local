import { useTranslation } from 'react-i18next'

export function AboutPage() {
  const { t } = useTranslation()
  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">{t('about.title')}</h1>
        <p className="page-desc">{t('about.desc')}</p>
      </header>
      <section className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '2.5rem' }}>
        <img
          src="/wasl-logo.png"
          alt="WASL Local"
          style={{ width: '90px', height: '90px', borderRadius: '20px', marginBottom: '1.25rem', boxShadow: '0 8px 32px rgba(0, 212, 255, 0.3)' }}
        />
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 0.5rem', background: 'linear-gradient(135deg, #00d4ff, #ffffff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          WASL Local • وَصْل
        </h2>
        <p style={{ color: 'var(--primary)', fontWeight: 600, margin: '0 0 1rem' }}>Your devices. One local connection.</p>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '450px', fontSize: '0.9rem', lineHeight: 1.6 }}>
          تطبيق محلي وسريع لنقل الملفات ومشاركة الحافظة وبث الشاشة وتبادل النصوص بين الهاتف والحاسوب بأقصى سرعة ممكنة وبأمان تام داخل شبكتك المنزلية بدون إنترنت.
        </p>
        <div style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          الإصدار 1.0.0 • Local-First & Zero-Cloud
        </div>
      </section>
    </div>
  )
}
