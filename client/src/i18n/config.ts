import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import ar from './locales/ar.json'
import fr from './locales/fr.json'
import en from './locales/en.json'

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ar: { translation: ar },
      fr: { translation: fr },
      en: { translation: en }
    },
    lng: localStorage.getItem('linkdesk_settings') ? JSON.parse(localStorage.getItem('linkdesk_settings')!).language : 'ar',
    fallbackLng: 'ar',
    interpolation: {
      escapeValue: false
    }
  })

export default i18n
