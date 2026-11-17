export const THEME_NAMES = ['light', 'dark', 'sepia', 'forest', 'ocean'] as const;
export type ThemeName = (typeof THEME_NAMES)[number];

export interface ThemeColors {
  background: string;
  card: string;
  primary: string;
  /** Accessible primary for text/icons on `background` or `card`. */
  primaryText: string;
  /** Text/icons on top of a `primary` fill. */
  onPrimary: string;
  /** Translucent primary tint for selected rows, chips and icon wells. */
  primaryMuted: string;
  /** Secondary color (Gray). */
  secondary: string;
  secondaryText: string;
  secondaryMuted: string;
  /** Accent color (Ash). */
  accent: string;
  accentText: string;
  accentMuted: string;
  text: string;
  textSecondary: string;
  border: string;
  /** "You are owed" / positive balances. */
  success: string;
  successMuted: string;
  /** "You owe" / destructive actions. */
  danger: string;
  dangerMuted: string;
  warning: string;
  overlay: string;
  shadow: string;
}

export interface ShadowStyle {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

export interface AppTheme {
  name: ThemeName;
  isDark: boolean;
  colors: ThemeColors;
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  radius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    pill: number;
  };
  typography: {
    size: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
      xxl: number;
      display: number;
    };
    lineHeight: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
      xxl: number;
      display: number;
    };
    weight: {
      regular: '400';
      medium: '500';
      semibold: '600';
      bold: '700';
    };
  };
  shadows: {
    sm: ShadowStyle;
    md: ShadowStyle;
  };
}
