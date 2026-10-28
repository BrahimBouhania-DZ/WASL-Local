import { createContext, useContext, useEffect, useState } from 'react'
import i18n from '../i18n/config'

export type ThemeMode = 'light' | 'dark' | 'auto'
export type Density = 'compact' | 'comfortable'
export type TextSize = 'sm' | 'md' | 'lg'

interface Settings {
  theme: ThemeMode
  density: Density
  textSize: TextSize
  reduceMotion: boolean
  primaryColor: string
  language: string
}

interface SettingsContextType {
  settings: Settings
  updateSettings: (patch: Partial<Settings>) => void
  resetSettings: () => void
}

const defaultSettings: Settings = {
  theme: 'dark',
  density: 'comfortable',
  textSize: 'md',
  reduceMotion: false,
  primaryColor: '#14B8A6',
  language: 'ar'
}

const RTL_LANGS = ['ar']

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const stored = localStorage.getItem('linkdesk_settings')
      if (stored) return { ...defaultSettings, ...JSON.parse(stored) }
    } catch {}
    return defaultSettings
  })

  useEffect(() => {
    localStorage.setItem('linkdesk_settings', JSON.stringify(settings))
    const root = document.documentElement

    // Theme
    if (settings.theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
    } else {
      root.setAttribute('data-theme', settings.theme)
    }

    // Density & text size
    root.setAttribute('data-density', settings.density)
    root.setAttribute('data-text-size', settings.textSize)
    root.style.setProperty('--primary', settings.primaryColor)

    // Reduce motion
    if (settings.reduceMotion) {
      root.style.setProperty('scroll-behavior', 'auto')
    } else {
      root.style.removeProperty('scroll-behavior')
    }

    // Language & text direction — the critical fix
    if (i18n.language !== settings.language) {
      i18n.changeLanguage(settings.language)
    }
    const isRtl = RTL_LANGS.includes(settings.language)
    root.setAttribute('dir', isRtl ? 'rtl' : 'ltr')
    root.setAttribute('lang', settings.language)
  }, [settings])

  const updateSettings = (patch: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...patch }))
  }

  const resetSettings = () => {
    setSettings(defaultSettings)
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
