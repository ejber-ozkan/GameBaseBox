import { Theme } from './types';

export const c64EditionTheme: Theme = {
  id: 'c64-edition',
  displayName: 'C64 Edition',
  colors: {
    primary: '#c0c1ff',
    primaryContainer: '#352879',
    secondary: '#7074c1',
    tertiary: '#e0a060',
    surface: '#131313',
    background: '#131313',
    outline: '#7074c1',
    outlineVariant: '#352879',
    text: '#c0c1ff',
    textMuted: '#7074c1',
  },
  typography: {
    sans: '"Space Mono", monospace',
    mono: '"Space Mono", monospace',
  },
  borderRadius: {
    sm: '0px',
    md: '0px',
    lg: '0px',
    xl: '0px',
  },
  effects: {
    scanlines: false,
    outerBorder: true,
    ambientGlow: false,
    steppedBorders: true,
    blinkingCursor: true,
  },
  layout: {
    structure: 'flat-alphabet',
    alphabetNavType: 'rail',
    itemAspectRatio: 'square',
    headerStyle: 'retro-monitor',
    railStyle: 'basic',
  },
  assets: {},
};

