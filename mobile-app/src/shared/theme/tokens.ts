import type { AppTheme, ThemeColors, ThemeName } from './types';

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 } as const;

/** Line heights are generous on purpose: Bengali matras/conjuncts clip with tight leading. */
export const typography = {
  size: { xs: 12, sm: 14, md: 16, lg: 18, xl: 22, xxl: 28, display: 34 },
  lineHeight: { xs: 18, sm: 22, md: 25, lg: 28, xl: 32, xxl: 38, display: 46 },
  weight: { regular: '400', medium: '500', semibold: '600', bold: '700' },
} as const;

export function createTheme(name: ThemeName, isDark: boolean, colors: ThemeColors): AppTheme {
  const opacity = isDark ? 0.45 : 0.08;
  return {
    name,
    isDark,
    colors,
    spacing,
    radius,
    typography,
    shadows: {
      sm: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: opacity,
        shadowRadius: 3,
        elevation: 1,
      },
      md: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: opacity * 1.5,
        shadowRadius: 10,
        elevation: 4,
      },
    },
  };
}
