import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

export interface ScreenProps {
  children: ReactNode;
  /** Scrollable content (default). Pass false for screens that manage their own list. */
  scroll?: boolean;
  /** Apply the top safe-area inset. Use only when there is no native header (tab screens). */
  topInset?: boolean;
  /** Apply the bottom safe-area inset. Turn off inside the tab navigator, whose bar handles it. */
  bottomInset?: boolean;
  /** Sticky area under the content, e.g. a primary action button. */
  footer?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
}

/**
 * Themed screen shell. Insets come from Unistyles' runtime (`rt.insets`), which is
 * edge-to-edge aware on Android, so content never hides under system bars.
 */
export function Screen({
  children,
  scroll = true,
  topInset = false,
  bottomInset = true,
  footer,
  contentStyle,
}: ScreenProps) {
  styles.useVariants({ topInset, bottomInset, hasFooter: footer !== undefined });

  return (
    // iOS: the ScrollView adjusts its own insets for the keyboard (accurate under native
    // headers and modals). Android edge-to-edge no longer resizes the window, so the
    // KeyboardAvoidingView does it there.
    <KeyboardAvoidingView
      style={styles.root}
      enabled={Platform.OS === 'android'}
      behavior={Platform.OS === 'android' ? 'padding' : undefined}
    >
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.content, contentStyle]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, contentStyle]}>{children}</View>
      )}
      {footer !== undefined ? <View style={styles.footer}>{footer}</View> : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
    variants: {
      topInset: {
        true: { paddingTop: rt.insets.top },
        false: {},
      },
    },
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    variants: {
      bottomInset: {
        true: {},
        false: {},
      },
      hasFooter: {
        true: {},
        false: {},
      },
    },
    compoundVariants: [
      { bottomInset: true, hasFooter: false, styles: { paddingBottom: rt.insets.bottom + theme.spacing.xxl } },
    ],
  },
  footer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: rt.insets.bottom + theme.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    gap: theme.spacing.sm,
    variants: {
      bottomInset: {
        true: {},
        false: { paddingBottom: theme.spacing.md },
      },
    },
  },
}));
