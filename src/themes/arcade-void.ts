import { Theme } from './types';

export const arcadeVoidTheme: Theme = {
  id: 'arcade-void',
  displayName: 'Arcade Void & Neon Acrylic',
  colors: {
    primary: '#8aebff',
    primaryContainer: '#0e3038',
    secondary: '#a855f7',
    tertiary: '#eab308',
    surface: '#141A21',
    background: '#0a0c10',
    outline: '#1f2937',
    outlineVariant: '#374151',
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
};
