import { TriangleAlert } from 'lucide-react-native';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { Button } from './button';
import { Text } from './text';

export interface ErrorFallbackProps {
  error: Error;
  onRetry: () => void;
}

export function ErrorFallback({ error, onRetry }: ErrorFallbackProps) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  return (
    <View style={styles.container}>
      <View style={styles.well}>
        <TriangleAlert size={32} color={theme.colors.danger} strokeWidth={1.8} />
      </View>
      <Text variant="heading" align="center">
        {t('errors.title')}
      </Text>
      <Text tone="secondary" align="center">
        {t('errors.body')}
      </Text>
      {__DEV__ ? (
        <Text variant="caption" tone="danger" align="center" selectable>
          {error.message}
        </Text>
      ) : null}
      <Button label={t('common.retry')} onPress={onRetry} />
    </View>
  );
}

interface BoundaryProps {
  children: ReactNode;
}

interface BoundaryState {
  error: Error | null;
}

/** Catches render errors below it and offers a retry instead of a white screen. */
export class AppErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  override state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    if (__DEV__) {
      console.error('[AppErrorBoundary]', error, info.componentStack);
    }
  }

  private readonly reset = (): void => {
    this.setState({ error: null });
  };

  override render(): ReactNode {
    const { error } = this.state;
    if (error) return <ErrorFallback error={error} onRetry={this.reset} />;
    return this.props.children;
  }
}

/** Expo Router per-route boundary: `export { RouteErrorBoundary as ErrorBoundary }` from a layout/route. */
export function RouteErrorBoundary({ error, retry }: { error: Error; retry: () => Promise<void> }) {
  return (
    <ErrorFallback
      error={error}
      onRetry={() => {
        void retry();
      }}
    />
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.xl,
    paddingTop: rt.insets.top + theme.spacing.xl,
    paddingBottom: rt.insets.bottom + theme.spacing.xl,
    backgroundColor: theme.colors.background,
  },
  well: {
    width: 72,
    height: 72,
    borderRadius: theme.radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.dangerMuted,
    marginBottom: theme.spacing.sm,
  },
}));
