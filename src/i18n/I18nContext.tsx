"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, normalizeLanguageCode } from './languages';
import type { LanguageInfo, LanguageDirection, NestedTranslationRecord } from './types';

// Static imports of locale dictionaries
import en from './locales/en.json';
import de from './locales/de.json';
import fr from './locales/fr.json';
import es from './locales/es.json';
import it from './locales/it.json';
import pt from './locales/pt.json';
import nl from './locales/nl.json';
import pl from './locales/pl.json';
import ru from './locales/ru.json';
import uk from './locales/uk.json';
import ja from './locales/ja.json';
import zhCN from './locales/zh-CN.json';
import zhTW from './locales/zh-TW.json';
import ko from './locales/ko.json';
import tr from './locales/tr.json';
import id from './locales/id.json';
import ar from './locales/ar.json';
import bg from './locales/bg.json';
import cs from './locales/cs.json';
import da from './locales/da.json';
import el from './locales/el.json';
import et from './locales/et.json';
import fi from './locales/fi.json';
import ga from './locales/ga.json';
import hr from './locales/hr.json';
import hu from './locales/hu.json';
import lt from './locales/lt.json';
import lv from './locales/lv.json';
import mt from './locales/mt.json';
import ro from './locales/ro.json';
import sk from './locales/sk.json';
import sl from './locales/sl.json';
import sv from './locales/sv.json';

const rawDictionaries: Record<string, NestedTranslationRecord> = {
  en,
  de,
  fr,
  es,
  it,
  pt,
  nl,
  pl,
  ru,
  uk,
  ja,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  ko,
  tr,
  id,
  ar,
  bg,
  cs,
  da,
  el,
  et,
  fi,
  ga,
  hr,
  hu,
  lt,
  lv,
  mt,
  ro,
  sk,
  sl,
  sv,
};

function flattenDictionary(
  obj: NestedTranslationRecord,
  prefix = '',
  target: Record<string, string> = {}
): Record<string, string> {
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      target[path] = value;
    } else if (typeof value === 'object' && value !== null) {
      flattenDictionary(value, path, target);
    }
  }
  return target;
}

// Pre-flattened O(1) lookup tables for ultra-fast performance
const flatDictionaries: Record<string, Record<string, string>> = {};
for (const [lang, dict] of Object.entries(rawDictionaries)) {
  flatDictionaries[lang] = flattenDictionary(dict);
}

export interface I18nContextType {
  language: string;
  languageInfo: LanguageInfo;
  direction: LanguageDirection;
  isRtl: boolean;
  setLanguage: (lang: string) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  supportedLanguages: Record<string, LanguageInfo>;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function detectSystemLanguage(): string {
  if (typeof window === 'undefined' || !navigator) return DEFAULT_LANGUAGE;
  const navLanguages = navigator.languages || [navigator.language];
  for (const lang of navLanguages) {
    const matched = normalizeLanguageCode(lang);
    if (matched && matched !== DEFAULT_LANGUAGE) {
      return matched;
    }
  }
  return normalizeLanguageCode(navigator.language || DEFAULT_LANGUAGE);
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const { settings, updateSettings } = useSettings();
  const [detectedLanguage] = useState<string>(() => detectSystemLanguage());

  const activeLanguageCode = useMemo(() => {
    const pref = settings.language || 'system';
    if (pref === 'system') {
      return detectedLanguage || DEFAULT_LANGUAGE;
    }
    return normalizeLanguageCode(pref);
  }, [settings.language, detectedLanguage]);

  const languageInfo = useMemo(() => {
    return SUPPORTED_LANGUAGES[activeLanguageCode] || SUPPORTED_LANGUAGES[DEFAULT_LANGUAGE];
  }, [activeLanguageCode]);

  const isRtl = languageInfo.dir === 'rtl';

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = activeLanguageCode;
      document.documentElement.dir = languageInfo.dir;
      if (isRtl) {
        document.documentElement.classList.add('rtl');
      } else {
        document.documentElement.classList.remove('rtl');
      }
    }
  }, [activeLanguageCode, languageInfo.dir, isRtl]);

  const t = useMemo(() => {
    const currentFlat = flatDictionaries[activeLanguageCode] || flatDictionaries[DEFAULT_LANGUAGE];
    const fallbackFlat = flatDictionaries[DEFAULT_LANGUAGE];

    return (key: string, params?: Record<string, string | number>): string => {
      let value = currentFlat[key] ?? fallbackFlat[key] ?? key;

      if (params) {
        for (const [paramKey, paramVal] of Object.entries(params)) {
          value = value.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
        }
      }

      return value;
    };
  }, [activeLanguageCode]);

  const setLanguage = useCallback((lang: string) => {
    updateSettings({ language: lang });
  }, [updateSettings]);

  const contextValue = useMemo<I18nContextType>(() => ({
    language: activeLanguageCode,
    languageInfo,
    direction: languageInfo.dir,
    isRtl,
    setLanguage,
    t,
    supportedLanguages: SUPPORTED_LANGUAGES,
  }), [activeLanguageCode, languageInfo, isRtl, setLanguage, t]);

  return <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>;
}

export function useTranslation(): I18nContextType {
  const context = useContext(I18nContext);
  if (!context) {
    const fallbackInfo = SUPPORTED_LANGUAGES[DEFAULT_LANGUAGE];
    const fallbackFlat = flatDictionaries[DEFAULT_LANGUAGE] || {};
    return {
      language: DEFAULT_LANGUAGE,
      languageInfo: fallbackInfo,
      direction: 'ltr',
      isRtl: false,
      setLanguage: () => {},
      t: (key: string, params?: Record<string, string | number>) => {
        let value = fallbackFlat[key] ?? key;
        if (params) {
          for (const [paramKey, paramVal] of Object.entries(params)) {
            value = value.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
          }
        }
        return value;
      },
      supportedLanguages: SUPPORTED_LANGUAGES,
    };
  }
  return context;
}
