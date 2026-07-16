import { expect, test, describe, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { SettingsProvider } from './SettingsContext';
import { ThemeProvider, useTheme } from './ThemeContext';

function ThemeTestComponent() {
  const { theme, setTheme, availableThemes } = useTheme();

  return (
    <div>
      <div data-testid="current-theme-id">{theme.id}</div>
      <div data-testid="current-theme-name">{theme.displayName}</div>
      <div data-testid="current-theme-primary">{theme.colors.primary}</div>
      <div data-testid="available-themes-count">{availableThemes.length}</div>
      
      {availableThemes.map((t) => (
        <button
          key={t.id}
          data-testid={`set-theme-${t.id}`}
          onClick={() => setTheme(t.id)}
        >
          Set {t.displayName}
        </button>
      ))}

      {availableThemes.map((t) => (
        <button
          key={t.id}
          data-testid={`set-theme-temp-${t.id}`}
          onClick={() => setTheme(t.id, false)}
        >
          Set Temp {t.displayName}
        </button>
      ))}
    </div>
  );
}

describe('ThemeContext', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.clear();
      // Remove any previously appended style tag
      const existing = document.getElementById('active-theme-styles');
      if (existing) {
        existing.remove();
      }
    }
  });

  afterEach(() => {
    if (typeof window !== 'undefined') {
      const existing = document.getElementById('active-theme-styles');
      if (existing) {
        existing.remove();
      }
    }
  });

  test('provides default theme (arcade-void) on initialization', () => {
    render(
      <SettingsProvider>
        <ThemeProvider>
          <ThemeTestComponent />
        </ThemeProvider>
      </SettingsProvider>
    );

    expect(screen.getByTestId('current-theme-id').textContent).toBe('arcade-void');
    expect(screen.getByTestId('current-theme-name').textContent).toBe('Arcade Void & Neon Acrylic');
    
    // Verify style tag injection
    const styleEl = document.getElementById('active-theme-styles');
    expect(styleEl).not.toBeNull();
    expect(styleEl?.textContent).toContain('--theme-primary: #8aebff');
    expect(document.documentElement.getAttribute('data-theme')).toBe('arcade-void');
  });

  test('switches theme and updates styles in document head', async () => {
    render(
      <SettingsProvider>
        <ThemeProvider>
          <ThemeTestComponent />
        </ThemeProvider>
      </SettingsProvider>
    );

    // Switch to Cyberpunk CRT
    fireEvent.click(screen.getByTestId('set-theme-cyberpunk-crt'));

    await waitFor(() => {
      expect(screen.getByTestId('current-theme-id').textContent).toBe('cyberpunk-crt');
    });
    
    expect(screen.getByTestId('current-theme-name').textContent).toBe('Cyberpunk CRT');
    expect(screen.getByTestId('current-theme-primary').textContent).toBe('#ff003c');
    
    const styleEl = document.getElementById('active-theme-styles');
    expect(styleEl?.textContent).toContain('--theme-primary: #ff003c');
    expect(document.documentElement.getAttribute('data-theme')).toBe('cyberpunk-crt');

    // Verify localStorage persistence
    const savedSettings = JSON.parse(window.localStorage.getItem('gb64_settings') || '{}');
    expect(savedSettings.themeId).toBe('cyberpunk-crt');
  });

  test('loads saved theme from settings', async () => {
    window.localStorage.setItem(
      'gb64_settings',
      JSON.stringify({
        themeId: 'c64-edition',
      })
    );

    render(
      <SettingsProvider>
        <ThemeProvider>
          <ThemeTestComponent />
        </ThemeProvider>
      </SettingsProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('current-theme-id').textContent).toBe('c64-edition');
    });

    expect(screen.getByTestId('current-theme-name').textContent).toBe('C64 Edition');
    const styleEl = document.getElementById('active-theme-styles');
    expect(styleEl?.textContent).toContain('--theme-primary: #c0c1ff');
    expect(document.documentElement.getAttribute('data-theme')).toBe('c64-edition');
  });

  test('switches theme temporarily without persisting to settings', async () => {
    render(
      <SettingsProvider>
        <ThemeProvider>
          <ThemeTestComponent />
        </ThemeProvider>
      </SettingsProvider>
    );

    // Switch temporarily to C64 Edition
    fireEvent.click(screen.getByTestId('set-theme-temp-c64-edition'));

    await waitFor(() => {
      expect(screen.getByTestId('current-theme-id').textContent).toBe('c64-edition');
    });

    expect(screen.getByTestId('current-theme-name').textContent).toBe('C64 Edition');
    expect(document.documentElement.getAttribute('data-theme')).toBe('c64-edition');

    // Verify localStorage has NOT been updated with the themeId
    const savedSettings = JSON.parse(window.localStorage.getItem('gb64_settings') || '{}');
    expect(savedSettings.themeId).not.toBe('c64-edition');
  });
});
