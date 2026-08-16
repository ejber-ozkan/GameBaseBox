import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { SUPPORTED_LANGUAGES, normalizeLanguageCode, DEFAULT_LANGUAGE } from './languages';
import en from './locales/en.json';

const localesDir = path.join(__dirname, 'locales');

// Extract all dot-separated keys and parameter placeholders
function extractKeysAndParams(obj: Record<string, any>, prefix = ''): { keys: string[]; params: Record<string, string[]> } {
  let keys: string[] = [];
  const params: Record<string, string[]> = {};

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const nested = extractKeysAndParams(value, fullKey);
      keys = keys.concat(nested.keys);
      Object.assign(params, nested.params);
    } else if (typeof value === 'string') {
      keys.push(fullKey);
      const matches = value.match(/\{[a-zA-Z0-9_]+\}/g) || [];
      params[fullKey] = matches.sort();
    }
  }

  return { keys: keys.sort(), params };
}

const { keys: baseKeys, params: baseParams } = extractKeysAndParams(en);

describe('i18n - Language Coverage & Registry', () => {
  it('registers all 33 supported languages', () => {
    const languageCodes = Object.keys(SUPPORTED_LANGUAGES);
    expect(languageCodes.length).toBe(33);
  });

  it('includes all 24 official European Union (EU) languages', () => {
    const euLanguages = [
      'bg', 'hr', 'cs', 'da', 'nl', 'en', 'et', 'fi', 'fr', 'de',
      'el', 'hu', 'ga', 'it', 'lv', 'lt', 'mt', 'pl', 'pt', 'ro',
      'sk', 'sl', 'es', 'sv',
    ];

    for (const code of euLanguages) {
      expect(SUPPORTED_LANGUAGES[code], `EU language '${code}' should be supported`).toBeDefined();
    }
  });

  it('includes top non-EU global languages', () => {
    const globalLanguages = ['ar', 'zh-CN', 'zh-TW', 'id', 'ja', 'ko', 'ru', 'tr', 'uk'];
    for (const code of globalLanguages) {
      expect(SUPPORTED_LANGUAGES[code], `Global language '${code}' should be supported`).toBeDefined();
    }
  });

  it('configures Arabic as RTL and European languages as LTR', () => {
    expect(SUPPORTED_LANGUAGES['ar'].dir).toBe('rtl');
    expect(SUPPORTED_LANGUAGES['en'].dir).toBe('ltr');
    expect(SUPPORTED_LANGUAGES['de'].dir).toBe('ltr');
    expect(SUPPORTED_LANGUAGES['ja'].dir).toBe('ltr');
  });
});

describe('i18n - Locale File Completeness & Key Parity', () => {
  const languageCodes = Object.keys(SUPPORTED_LANGUAGES);

  languageCodes.forEach((code) => {
    describe(`Locale '${code}'`, () => {
      const filePath = path.join(localesDir, `${code}.json`);

      it(`file exists on disk: ${code}.json`, () => {
        expect(fs.existsSync(filePath), `Missing locale file: ${filePath}`).toBe(true);
      });

      it(`matches 100% of keys in canonical en.json`, () => {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const { keys: targetKeys } = extractKeysAndParams(content);

        const missingKeys = baseKeys.filter((k) => !targetKeys.includes(k));
        const extraKeys = targetKeys.filter((k) => !baseKeys.includes(k));

        expect(missingKeys, `Missing keys in ${code}.json`).toEqual([]);
        expect(extraKeys, `Extra orphan keys in ${code}.json`).toEqual([]);
      });

      it(`has matching interpolation parameters for parameterized strings`, () => {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const { params: targetParams } = extractKeysAndParams(content);

        for (const [key, expectedParams] of Object.entries(baseParams)) {
          if (expectedParams.length > 0) {
            const actualParams = targetParams[key] || [];
            expect(actualParams, `Parameter placeholder mismatch for key '${key}' in ${code}.json`).toEqual(expectedParams);
          }
        }
      });
    });
  });
});

describe('i18n - Language Code Normalization', () => {
  it('normalizes exact matches', () => {
    expect(normalizeLanguageCode('en')).toBe('en');
    expect(normalizeLanguageCode('de')).toBe('de');
    expect(normalizeLanguageCode('zh-CN')).toBe('zh-CN');
  });

  it('normalizes regional dialect codes to base code', () => {
    expect(normalizeLanguageCode('de-DE')).toBe('de');
    expect(normalizeLanguageCode('de-AT')).toBe('de');
    expect(normalizeLanguageCode('fr-CA')).toBe('fr');
    expect(normalizeLanguageCode('es-MX')).toBe('es');
    expect(normalizeLanguageCode('pt-BR')).toBe('pt');
  });

  it('normalizes Chinese language variants', () => {
    expect(normalizeLanguageCode('zh-HK')).toBe('zh-TW');
    expect(normalizeLanguageCode('zh-TW')).toBe('zh-TW');
    expect(normalizeLanguageCode('zh-CN')).toBe('zh-CN');
    expect(normalizeLanguageCode('zh-Hans')).toBe('zh-CN');
  });

  it('falls back to default language for empty or unsupported inputs', () => {
    expect(normalizeLanguageCode('')).toBe(DEFAULT_LANGUAGE);
    expect(normalizeLanguageCode('xx-YY')).toBe(DEFAULT_LANGUAGE);
  });
});
