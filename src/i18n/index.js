import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import te from './locales/te.json';
import hi from './locales/hi.json';

const savedLang = typeof localStorage !== 'undefined'
  ? (localStorage.getItem('krishisaathi_lang') || localStorage.getItem('krishisaathi_preferred_lang'))
  : null;

const initialLanguage = (savedLang && ['en', 'te', 'hi'].includes(savedLang)) ? savedLang : 'en';

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
    supportedLngs: ['en', 'te', 'hi'],
    interpolation: {
      escapeValue: false,
    },
  });

if (typeof document !== 'undefined') {
  document.documentElement.lang = initialLanguage;
}

export default i18n;
