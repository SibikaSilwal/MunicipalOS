import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from '@/locales/en/common.json'
import ne from '@/locales/ne/common.json'

const STORAGE_KEY = 'lang'

function getInitialLanguage(): 'en' | 'ne' {
  const saved = localStorage.getItem(STORAGE_KEY)
  return saved === 'ne' ? 'ne' : 'en'
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ne: { translation: ne },
  },
  lng: getInitialLanguage(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
})

i18n.on('languageChanged', (lng) => {
  if (lng === 'en' || lng === 'ne') {
    localStorage.setItem(STORAGE_KEY, lng)
  }
})

export default i18n

