/**
 * Unistyles 3 configuration. Imported first from the root `index.ts` entry so it
 * runs before any `StyleSheet.create` call.
 *
 * Unistyles 3 replaced the v2 `UnistylesRegistry` with `StyleSheet.configure`; this is
 * where themes and breakpoints are registered.
 */
import { StyleSheet } from 'react-native-unistyles';

import { themes, type AppThemes } from './themes';

export const breakpoints = {
  xs: 0,
  sm: 360,
  md: 600,
  lg: 900,
  xl: 1200,
} as const;

type AppBreakpoints = typeof breakpoints;

declare module 'react-native-unistyles' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface UnistylesThemes extends AppThemes {}
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface UnistylesBreakpoints extends AppBreakpoints {}
}

StyleSheet.configure({
  themes,
  breakpoints,
  settings: {
    // The user picks the theme explicitly (5 themes); never follow the OS color scheme.
    adaptiveThemes: false,
    // The persisted theme is applied right after store hydration (see AppBootstrap).
    initialTheme: 'light',
  },
});
