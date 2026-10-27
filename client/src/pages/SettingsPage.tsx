import { useTranslation } from 'react-i18next'
import { useSettings } from '../context/SettingsContext'

const colors = ['#14B8A6', '#38BDF8', '#22C55E', '#F59E0B', '#EF4444', '#A855F7', '#EC4899']

export function SettingsPage() {
  const { t } = useTranslation()
  const { settings, updateSettings, resetSettings } = useSettings()

  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">{t('settings.title')}</h1>
        <p className="page-desc">{t('settings.desc')}</p>
      </header>
      <div className="grid">
        <section className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">{t('settings.appearance')}</h2>
              <p className="card-desc">{t('settings.appearanceDesc')}</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>{t('settings.theme')}</label>
              <select className="input" value={settings.theme} onChange={(e) => updateSettings({ theme: e.target.value as any })}>
                <option value="dark">{t('theme.dark')}</option>
                <option value="light">{t('theme.light')}</option>
                <option value="auto">{t('theme.auto')}</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>{t('settings.primaryColor')}</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {colors.map(c => (
                  <button
                    key={c}
                    onClick={() => updateSettings({ primaryColor: c })}
                    style={{ width: '32px', height: '32px', borderRadius: '50%', background: c, border: settings.primaryColor === c ? '2px solid var(--text-primary)' : '1px solid var(--border)' }}
                  />
                ))}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>{t('settings.density')}</label>
              <select className="input" value={settings.density} onChange={(e) => updateSettings({ density: e.target.value as any })}>
                <option value="comfortable">{t('settings.comfortable')}</option>
                <option value="compact">{t('settings.compact')}</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>{t('settings.textSize')}</label>
              <select className="input" value={settings.textSize} onChange={(e) => updateSettings({ textSize: e.target.value as any })}>
                <option value="sm">{t('settings.small')}</option>
                <option value="md">{t('settings.medium')}</option>
                <option value="lg">{t('settings.large')}</option>
              </select>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <input type="checkbox" checked={settings.reduceMotion} onChange={(e) => updateSettings({ reduceMotion: e.target.checked })} />
              <span>{t('settings.reduceMotion')}</span>
            </label>
          </div>
        </section>
        <section className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">{t('settings.language')}</h2>
              <p className="card-desc">{t('settings.languageDesc')}</p>
            </div>
          </div>
          <div>
            <select className="input" value={settings.language} onChange={(e) => updateSettings({ language: e.target.value })}>
              <option value="ar">العربية</option>
              <option value="fr">Français</option>
              <option value="en">English</option>
            </select>
          </div>
        </section>
        <section className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">{t('settings.reset')}</h2>
              <p className="card-desc">{t('settings.resetDesc')}</p>
            </div>
          </div>
          <button className="btn" onClick={resetSettings}>{t('settings.resetBtn')}</button>
        </section>
      </div>
    </div>
  )
}
