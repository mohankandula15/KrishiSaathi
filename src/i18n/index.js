import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import te from './locales/te.json';
import hi from './locales/hi.json';
import { sanitizeLanguage, isSupportedLanguage, SUPPORTED_LANGUAGE_CODES } from './languages';

const savedLang = typeof localStorage !== 'undefined'
  ? (localStorage.getItem('krishisaathi_lang') || localStorage.getItem('krishisaathi_preferred_lang'))
  : null;

const initialLanguage = sanitizeLanguage(savedLang);

if (typeof localStorage !== 'undefined' && savedLang && !isSupportedLanguage(savedLang)) {
  localStorage.setItem('krishisaathi_lang', 'en');
  localStorage.setItem('krishisaathi_preferred_lang', 'en');
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      te: { translation: te },
      hi: { translation: hi },
    },
    lng: initialLanguage,
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGE_CODES,
    interpolation: {
      escapeValue: false,
    },
  });

if (typeof document !== 'undefined') {
  document.documentElement.lang = initialLanguage;
}

export default i18n;
