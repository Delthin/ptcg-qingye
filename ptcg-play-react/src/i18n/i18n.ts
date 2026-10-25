import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../../../ptcg-play/src/assets/i18n/en.json';
import zh from '../../../ptcg-play/src/assets/i18n/zh.json';
import es from '../../../ptcg-play/src/assets/i18n/es.json';
import jp from '../../../ptcg-play/src/assets/i18n/jp.json';
import fr from '../../../ptcg-play/src/assets/i18n/fr.json';
import { isSupportedLanguage, type SupportedLanguageCode } from './languages';
import { roomEn, roomZh } from './roomTranslations';

const resources = {
  zh: { translation: { ...zh, ...roomZh } },
  en: { translation: { ...en, ...roomEn } },
  es: { translation: es },
  jp: { translation: jp },
  fr: { translation: fr },
} as const;

function normalizeStoredLanguage(): void {
  const raw = localStorage.getItem('language');
  if (raw !== null && !isSupportedLanguage(raw)) {
    localStorage.removeItem('language');
  }
}

function pickLanguage(): SupportedLanguageCode {
  if (!localStorage.getItem('ptcg.duo.languageInitialized')) {
    localStorage.setItem('language', 'zh');
    localStorage.setItem('ptcg.duo.languageInitialized', '1');
  }
  normalizeStoredLanguage();
  const raw = localStorage.getItem('language');
  if (raw && isSupportedLanguage(raw)) {
    return raw;
  }
  const m = typeof navigator !== 'undefined' ? navigator.language.match(/\w\w/i) : null;
  const fromNav = m?.[0]?.toLowerCase();
  if (fromNav && isSupportedLanguage(fromNav)) {
    return fromNav;
  }
  return 'zh';
}

void i18n.use(initReactI18next).init({
  resources,
  lng: pickLanguage(),
  fallbackLng: 'en',
  supportedLngs: ['zh', 'en', 'es', 'jp', 'fr'],
  interpolation: {
    escapeValue: false,
  },
});

export function setAppLanguage(code: SupportedLanguageCode): void {
  localStorage.setItem('language', code);
  void i18n.changeLanguage(code);
}

export default i18n;
