import { expect, test, describe, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { ThemeDecorator } from './ThemeDecorator';

function ThemeSwitcherComponent() {
  const { setTheme } = useTheme();
  return (
    <div>
      <button data-testid="btn-arcade" onClick={() => setTheme('arcade-void')}>Arcade</button>
      <button data-testid="btn-cyberpunk" onClick={() => setTheme('cyberpunk-crt')}>Cyberpunk</button>
      <button data-testid="btn-c64" onClick={() => setTheme('c64-edition')}>C64</button>
    </div>
  );
}

describe('ThemeDecorator', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.clear();
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

  test('renders children correctly', () => {
    render(
      <SettingsProvider>
        <ThemeProvider>
          <ThemeDecorator>
            <div data-testid="child">Hello World</div>
          </ThemeDecorator>
        </ThemeProvider>
      </SettingsProvider>
    );

    expect(screen.getByTestId('child').textContent).toBe('Hello World');
  });

  test('applies theme-specific elements dynamically', async () => {
    render(
      <SettingsProvider>
        <ThemeProvider>
          <ThemeDecorator>
            <ThemeSwitcherComponent />
          </ThemeDecorator>
        </ThemeProvider>
      </SettingsProvider>
    );

    // Default theme is 'arcade-void' (ambientGlow = true, scanlines = false, outerBorder = false)
    expect(screen.queryByTestId('theme-decorator-glow')).not.toBeNull();
    expect(screen.queryByTestId('theme-decorator-scanlines')).toBeNull();
    expect(screen.queryByTestId('theme-decorator-outer-border')).toBeNull();
    expect(screen.queryByTestId('theme-decorator-normal-container')).not.toBeNull();

    // Switch to 'cyberpunk-crt' (ambientGlow = false, scanlines = true, outerBorder = false)
    fireEvent.click(screen.getByTestId('btn-cyberpunk'));

    await waitFor(() => {
      expect(screen.queryByTestId('theme-decorator-scanlines')).not.toBeNull();
    });
    expect(screen.queryByTestId('theme-decorator-glow')).toBeNull();
    expect(screen.queryByTestId('theme-decorator-outer-border')).toBeNull();
    expect(screen.queryByTestId('theme-decorator-normal-container')).not.toBeNull();

    // Switch to 'c64-edition' (ambientGlow = false, scanlines = false, outerBorder = true)
    fireEvent.click(screen.getByTestId('btn-c64'));

    await waitFor(() => {
      expect(screen.queryByTestId('theme-decorator-outer-border')).not.toBeNull();
    });
    expect(screen.queryByTestId('theme-decorator-glow')).toBeNull();
    expect(screen.queryByTestId('theme-decorator-scanlines')).toBeNull();
    expect(screen.queryByTestId('theme-decorator-normal-container')).toBeNull();
  });
});
