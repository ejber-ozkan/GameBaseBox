import { Theme } from './types';

export const arcadeVoidTheme: Theme = {
  id: 'arcade-void',
  displayName: 'Arcade Void & Neon Acrylic',
  colors: {
    primary: '#8aebff',
    primaryContainer: 'rgba(14, 48, 56, 0.6)',
    secondary: '#a855f7',
    tertiary: '#eab308',
    surface: 'rgba(20, 26, 33, 0.85)',
    background: '#0a0f15',
    outline: 'rgba(255, 255, 255, 0.08)',
    outlineVariant: 'rgba(255, 255, 255, 0.14)',
    text: '#ffffff',
    textMuted: '#9ca3af',
  },
  typography: {
    sans: '"Manrope", "Inter", sans-serif',
    mono: '"Space Grotesk", monospace',
  },
  borderRadius: {
    sm: '0.125rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
  },
  effects: {
    scanlines: false,
    outerBorder: false,
    ambientGlow: true,
    steppedBorders: false,
    blinkingCursor: false,
    glassmorphism: true,
  },
  layout: {
    structure: 'shelves',
    alphabetNavType: 'jump-bar',
    itemAspectRatio: 'portrait',
    headerStyle: 'standard',
    railStyle: 'acrylic',
  },
  assets: {},
};

