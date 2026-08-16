import type { LanguageInfo } from './types';

export const SUPPORTED_LANGUAGES: Record<string, LanguageInfo> = {
  // Official European Union (EU) Languages (24)
  bg: { code: 'bg', name: 'Bulgarian', nativeName: 'Български', dir: 'ltr' },
  hr: { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski', dir: 'ltr' },
  cs: { code: 'cs', name: 'Czech', nativeName: 'Čeština', dir: 'ltr' },
  da: { code: 'da', name: 'Danish', nativeName: 'Dansk', dir: 'ltr' },
  nl: { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', dir: 'ltr' },
  en: { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr' },
  et: { code: 'et', name: 'Estonian', nativeName: 'Eesti', dir: 'ltr' },
  fi: { code: 'fi', name: 'Finnish', nativeName: 'Suomi', dir: 'ltr' },
  fr: { code: 'fr', name: 'French', nativeName: 'Français', dir: 'ltr' },
  de: { code: 'de', name: 'German', nativeName: 'Deutsch', dir: 'ltr' },
  el: { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', dir: 'ltr' },
  hu: { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', dir: 'ltr' },
  ga: { code: 'ga', name: 'Irish', nativeName: 'Gaeilge', dir: 'ltr' },
  it: { code: 'it', name: 'Italian', nativeName: 'Italiano', dir: 'ltr' },
  lv: { code: 'lv', name: 'Latvian', nativeName: 'Latviešu', dir: 'ltr' },
  lt: { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių', dir: 'ltr' },
  mt: { code: 'mt', name: 'Maltese', nativeName: 'Malti', dir: 'ltr' },
  pl: { code: 'pl', name: 'Polish', nativeName: 'Polski', dir: 'ltr' },
  pt: { code: 'pt', name: 'Portuguese', nativeName: 'Português', dir: 'ltr' },
  ro: { code: 'ro', name: 'Romanian', nativeName: 'Română', dir: 'ltr' },
  sk: { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina', dir: 'ltr' },
  sl: { code: 'sl', name: 'Slovenian', nativeName: 'Slovenščina', dir: 'ltr' },
  es: { code: 'es', name: 'Spanish', nativeName: 'Español', dir: 'ltr' },
  sv: { code: 'sv', name: 'Swedish', nativeName: 'Svenska', dir: 'ltr' },

  // Additional Top Worldwide Languages
  ar: { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl' },
  'zh-CN': { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文', dir: 'ltr' },
  'zh-TW': { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '繁體中文', dir: 'ltr' },
  id: { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', dir: 'ltr' },
  ja: { code: 'ja', name: 'Japanese', nativeName: '日本語', dir: 'ltr' },
  ko: { code: 'ko', name: 'Korean', nativeName: '한국어', dir: 'ltr' },
  ru: { code: 'ru', name: 'Russian', nativeName: 'Русский', dir: 'ltr' },
  tr: { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', dir: 'ltr' },
  uk: { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', dir: 'ltr' },
};

export const DEFAULT_LANGUAGE = 'en';

export function normalizeLanguageCode(code: string): string {
  if (!code) return DEFAULT_LANGUAGE;
  const cleanCode = code.trim();
  if (SUPPORTED_LANGUAGES[cleanCode]) return cleanCode;

  // Try matching base language prefix (e.g. 'de-DE' -> 'de', 'pt-BR' -> 'pt')
  const baseCode = cleanCode.split('-')[0].toLowerCase();
  if (SUPPORTED_LANGUAGES[baseCode]) return baseCode;

  // Check case-insensitive exact match
  const lowerCode = cleanCode.toLowerCase();
  for (const key of Object.keys(SUPPORTED_LANGUAGES)) {
    if (key.toLowerCase() === lowerCode) return key;
  }

  // Handle Chinese dialects
  if (lowerCode.startsWith('zh')) {
    if (lowerCode.includes('tw') || lowerCode.includes('hk') || lowerCode.includes('hant')) {
      return 'zh-TW';
    }
    return 'zh-CN';
  }

  return DEFAULT_LANGUAGE;
}
