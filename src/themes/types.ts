export interface ThemeColors {
  primary: string;
  primaryContainer: string;
  secondary: string;
  tertiary: string;
  surface: string;
  background: string;
  outline: string;
  outlineVariant: string;
  text: string;
  textMuted: string;
}

export interface ThemeTypography {
  sans: string;
  mono: string;
}

export interface ThemeBorderRadius {
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

export interface ThemeEffects {
  scanlines: boolean;
  outerBorder: boolean;
  ambientGlow: boolean;
  steppedBorders: boolean;
  blinkingCursor: boolean;
  glassmorphism?: boolean;
}

export interface ThemeLayout {
  structure: 'shelves' | 'flat-alphabet';
  alphabetNavType: 'jump-bar' | 'rail';
  itemAspectRatio: 'portrait' | 'square' | 'landscape';
  headerStyle: 'standard' | 'minimal' | 'retro-monitor';
  railStyle: 'acrylic' | 'terminal' | 'basic';
}

export interface ThemeAssets {
  wallpaper?: string;
  soundPack?: string;
}

export interface Theme {
  id: string;
  displayName: string;
  colors: ThemeColors;
  typography: ThemeTypography;
  borderRadius: ThemeBorderRadius;
  effects: ThemeEffects;
  layout: ThemeLayout;
  assets: ThemeAssets;
}

