import { Theme } from './types';
import { arcadeVoidTheme } from './arcade-void';
import { cyberpunkCrtTheme } from './cyberpunk-crt';
import { c64EditionTheme } from './c64-edition';

export * from './types';
export * from './arcade-void';
export * from './cyberpunk-crt';
export * from './c64-edition';

export const BUILT_IN_THEMES: Theme[] = [
  arcadeVoidTheme,
  cyberpunkCrtTheme,
  c64EditionTheme,
];

export function applyTheme(theme: Theme) {
  if (typeof window === 'undefined') return;

  let styleEl = document.getElementById('active-theme-styles') as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'active-theme-styles';
    document.head.appendChild(styleEl);
  }

  const css = `
    :root {
      --theme-primary: ${theme.colors.primary};
      --theme-primary-container: ${theme.colors.primaryContainer};
      --theme-secondary: ${theme.colors.secondary};
      --theme-tertiary: ${theme.colors.tertiary};
      --theme-surface: ${theme.colors.surface};
      --theme-background: ${theme.colors.background};
      --theme-outline: ${theme.colors.outline};
      --theme-outline-variant: ${theme.colors.outlineVariant};
      --theme-text: ${theme.colors.text};
      --theme-text-muted: ${theme.colors.textMuted};

      --theme-font-sans: ${theme.typography.sans};
      --theme-font-mono: ${theme.typography.mono};

      --theme-radius-sm: ${theme.borderRadius.sm};
      --theme-radius-md: ${theme.borderRadius.md};
      --theme-radius-lg: ${theme.borderRadius.lg};
      --theme-radius-xl: ${theme.borderRadius.xl};
    }
  `;

  styleEl.textContent = css;

  // Add HTML attribute for theme identification
  document.documentElement.setAttribute('data-theme', theme.id);
  document.documentElement.setAttribute('data-theme-glass', String(!!theme.effects.glassmorphism));
  document.documentElement.setAttribute('data-theme-scanlines', String(!!theme.effects.scanlines));
  document.documentElement.setAttribute('data-theme-glow', String(!!theme.effects.ambientGlow));
}
