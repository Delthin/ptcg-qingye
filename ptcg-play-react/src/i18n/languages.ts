/** Matches ptcg-play environment.languages keys */
export const SUPPORTED_LANGUAGE_CODES = ['zh', 'en', 'es', 'jp', 'fr'] as const;

export type SupportedLanguageCode = (typeof SUPPORTED_LANGUAGE_CODES)[number];

export function isSupportedLanguage(code: string): code is SupportedLanguageCode {
  return (SUPPORTED_LANGUAGE_CODES as readonly string[]).includes(code);
}

export const LANGUAGE_LABELS: Record<SupportedLanguageCode, string> = {
  zh: '简体中文',
  en: 'English',
  es: 'Español',
  jp: '日本語',
  fr: 'Français',
};
