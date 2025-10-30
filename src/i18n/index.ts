import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import ja from './locales/ja.json'
import zh from './locales/zh.json'

const resources = {
  en: { translation: en },
  ja: { translation: ja },
  zh: { translation: zh },
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // デフォルト言語
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React は既に XSS を防いでいるため
    },
  })

export default i18n

