export type LanguageDirection = 'ltr' | 'rtl';

export interface LanguageInfo {
  code: string;
  name: string;
  nativeName: string;
  dir: LanguageDirection;
}

export type NestedTranslationRecord = {
  [key: string]: string | NestedTranslationRecord;
};

export type TranslationKey = string;
