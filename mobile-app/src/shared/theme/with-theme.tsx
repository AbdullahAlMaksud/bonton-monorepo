import type { ComponentType } from 'react';
import { withUnistyles, type UnistylesMiniRuntime } from 'react-native-unistyles';
import type { AppTheme } from './types';

/**
 * Extends component props with `theme` and `rt` injected by `withTheme` / `withUnistyles`.
 */
export type WithTheme<P = object> = P & {
  theme: AppTheme;
  rt: UnistylesMiniRuntime;
};

/**
 * HOC that injects `theme` and `rt` into the component props.
 * Avoids calling `useUnistyles()` hooks or using inline `UnistylesRuntime`.
 */
export function withTheme<P extends object>(
  Component: ComponentType<WithTheme<P>>,
): ComponentType<P> {
  return withUnistyles(Component as any, (theme, rt) => ({
    theme: theme as AppTheme,
    rt,
  })) as unknown as ComponentType<P>;
}
