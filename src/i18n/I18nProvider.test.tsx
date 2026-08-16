import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { SettingsProvider } from '../contexts/SettingsContext';
import { I18nProvider, useTranslation } from './I18nContext';

function TestTranslationConsumer() {
  const { t, language, isRtl, direction, setLanguage } = useTranslation();

  return (
    <div>
      <div data-testid="active-lang">{language}</div>
      <div data-testid="is-rtl">{isRtl ? 'true' : 'false'}</div>
      <div data-testid="direction">{direction}</div>
      <div data-testid="translated-save">{t('common.save')}</div>
      <div data-testid="translated-param">{t('library.itemsCount', { count: 42 })}</div>
      <div data-testid="translated-subtune">{t('detail.subtune', { current: 2, total: 5 })}</div>
      <button data-testid="set-de-btn" onClick={() => setLanguage('de')}>Set German</button>
      <button data-testid="set-ar-btn" onClick={() => setLanguage('ar')}>Set Arabic</button>
      <button data-testid="set-fr-btn" onClick={() => setLanguage('fr')}>Set French</button>
      <button data-testid="set-ja-btn" onClick={() => setLanguage('ja')}>Set Japanese</button>
    </div>
  );
}

describe('I18nProvider & useTranslation Hook', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.lang = 'en';
    document.documentElement.dir = 'ltr';
    document.documentElement.classList.remove('rtl');
  });

  it('renders default English translations properly', () => {
    render(
      <SettingsProvider>
        <I18nProvider>
          <TestTranslationConsumer />
        </I18nProvider>
      </SettingsProvider>
    );

    expect(screen.getByTestId('active-lang').textContent).toBe('en');
    expect(screen.getByTestId('is-rtl').textContent).toBe('false');
    expect(screen.getByTestId('direction').textContent).toBe('ltr');
    expect(screen.getByTestId('translated-save').textContent).toBe('Save');
    expect(screen.getByTestId('translated-param').textContent).toBe('42 items');
    expect(screen.getByTestId('translated-subtune').textContent).toBe('Subtune 2 of 5');
  });

  it('switches dynamically to German (de)', () => {
    render(
      <SettingsProvider>
        <I18nProvider>
          <TestTranslationConsumer />
        </I18nProvider>
      </SettingsProvider>
    );

    fireEvent.click(screen.getByTestId('set-de-btn'));

    expect(screen.getByTestId('active-lang').textContent).toBe('de');
    expect(screen.getByTestId('is-rtl').textContent).toBe('false');
    expect(screen.getByTestId('translated-save').textContent).toBe('Speichern');
    expect(screen.getByTestId('translated-param').textContent).toBe('42 Elemente');
  });

  it('switches dynamically to Arabic (ar) and enables RTL', () => {
    render(
      <SettingsProvider>
        <I18nProvider>
          <TestTranslationConsumer />
        </I18nProvider>
      </SettingsProvider>
    );

    fireEvent.click(screen.getByTestId('set-ar-btn'));

    expect(screen.getByTestId('active-lang').textContent).toBe('ar');
    expect(screen.getByTestId('is-rtl').textContent).toBe('true');
    expect(screen.getByTestId('direction').textContent).toBe('rtl');
    expect(screen.getByTestId('translated-save').textContent).toBe('حفظ');
    expect(document.documentElement.dir).toBe('rtl');
    expect(document.documentElement.classList.contains('rtl')).toBe(true);
  });

  it('switches dynamically to French (fr) and Japanese (ja)', () => {
    render(
      <SettingsProvider>
        <I18nProvider>
          <TestTranslationConsumer />
        </I18nProvider>
      </SettingsProvider>
    );

    fireEvent.click(screen.getByTestId('set-fr-btn'));
    expect(screen.getByTestId('active-lang').textContent).toBe('fr');
    expect(screen.getByTestId('translated-save').textContent).toBe('Enregistrer');

    fireEvent.click(screen.getByTestId('set-ja-btn'));
    expect(screen.getByTestId('active-lang').textContent).toBe('ja');
    expect(screen.getByTestId('translated-save').textContent).toBe('保存');
  });
});
