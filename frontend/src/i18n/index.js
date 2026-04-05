import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import hi from './locales/hi.json';
import te from './locales/te.json';
import kn from './locales/kn.json';
import ml from './locales/ml.json';

const LANGUAGE_KEY = 'rehab_language';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు' },
  { code: 'kn', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ' },
  { code: 'ml', label: 'Malayalam', nativeLabel: 'മലയാളം' },
];

const SUPPORTED_CODES = SUPPORTED_LANGUAGES.map((l) => l.code);

function getSavedLanguage() {
  try {
    const saved = localStorage.getItem(LANGUAGE_KEY);
    if (saved && SUPPORTED_CODES.includes(saved)) return saved;
  } catch {}

  const browserLang = navigator.language?.split('-')[0];
  if (browserLang && SUPPORTED_CODES.includes(browserLang)) return browserLang;

  return 'en';
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
    te: { translation: te },
    kn: { translation: kn },
    ml: { translation: ml },
  },
  lng: getSavedLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export const changeLanguage = (lng) => {
  i18n.changeLanguage(lng);
  try {
    localStorage.setItem(LANGUAGE_KEY, lng);
  } catch {}
};

export default i18n;
