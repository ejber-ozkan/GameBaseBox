import { Theme } from './types';

export const cyberpunkCrtTheme: Theme = {
  id: 'cyberpunk-crt',
  displayName: 'Cyberpunk CRT',
  colors: {
    primary: '#ff003c',
    primaryContainer: '#3a000d',
    secondary: '#ff5a00',
    tertiary: '#00f0ff',
    surface: '#0a0a0c',
    background: '#040405',
    outline: '#ff003c',
    outlineVariant: '#ff5a00',
    text: '#ff003c',
    textMuted: '#7f001e',
  },
  typography: {
    sans: '"JetBrains Mono", monospace',
    mono: '"JetBrains Mono", monospace',
  },
  borderRadius: {
    sm: '0px',
    md: '0px',
    lg: '0px',
    xl: '0px',
  },
  effects: {
    scanlines: true,
    outerBorder: false,
    ambientGlow: false,
    steppedBorders: false,
    blinkingCursor: false,
  },
};
