import { Theme } from './types';

export const cyberpunkCrtTheme: Theme = {
  id: 'cyberpunk-crt',
  displayName: 'Cyberpunk CRT',
  colors: {
    primary: '#ffb3b2',
    primaryContainer: '#ff525c',
    secondary: '#ffb787',
    tertiary: '#00dbe9',
    surface: '#0a0a0c',
    background: '#040405',
    outline: '#ffb3b2',
    outlineVariant: '#ff8000',
    text: '#ffb3b2',
    textMuted: '#e9bcba',
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
    tvNoise: true,
  },
  layout: {
    structure: 'flat-alphabet',
    alphabetNavType: 'rail',
    itemAspectRatio: 'square',
    headerStyle: 'minimal',
    railStyle: 'terminal',
  },
  assets: {},
};

