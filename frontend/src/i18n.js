import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import enTranslation from './locales/en.json'
import ruTranslation from './locales/ru.json'

// Custom language detector for Telegram WebApp
const telegramLanguageDetector = {
  name: 'telegramDetector',
  lookup() {
    // Check if running in Telegram WebApp
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      // Get user language from Telegram
      const telegramLang = window.Telegram.WebApp.initDataUnsafe?.user?.language_code
      
      if (telegramLang) {
        // Map Telegram language codes to our supported languages
        // If Russian, return 'ru', otherwise return 'en'
        return telegramLang.toLowerCase().startsWith('ru') ? 'ru' : 'en'
      }
    }
    
    // Fallback to browser language
    const browserLang = navigator.language || navigator.userLanguage
    return browserLang?.toLowerCase().startsWith('ru') ? 'ru' : 'en'
  },
  cacheUserLanguage(lng) {
    // Save language preference to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('i18nextLng', lng)
    }
  }
}

// Create custom language detector
const languageDetector = new LanguageDetector()
languageDetector.addDetector(telegramLanguageDetector)

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslation
      },
      ru: {
        translation: ruTranslation
      }
    },
    fallbackLng: 'en', // Default language
    debug: false,
    
    interpolation: {
      escapeValue: false // React already escapes values
    },
    
    detection: {
      // Order of language detection
      order: [
        'telegramDetector', // Custom Telegram detector (first priority)
        'localStorage',     // Saved language preference
        'navigator',        // Browser language
      ],
      
      // Cache user language preference
      caches: ['localStorage'],
      
      // Don't cache for development
      excludeCacheFor: ['dev'],
    }
  })

export default i18n

