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

export interface Theme {
  id: string;
  displayName: string;
  colors: ThemeColors;
  typography: ThemeTypography;
  borderRadius: ThemeBorderRadius;
  effects: ThemeEffects;
}
