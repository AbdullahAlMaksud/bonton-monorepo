import type { LucideIcon } from 'lucide-react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { haptics } from '@/shared/lib/haptics';

import { PressableScale } from './pressable-scale';
import { Text, type TextTone } from './text';

export type ButtonKind = 'primary' | 'secondary' | 'accent' | 'danger' | 'ghost';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  kind?: ButtonKind;
  icon?: LucideIcon;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

const TONE: Record<ButtonKind, TextTone> = {
  primary: 'onPrimary',
  secondary: 'primary',
  accent: 'onPrimary',
  danger: 'danger',
  ghost: 'primary',
};

export function Button({ label, onPress, kind = 'primary', icon: Icon, disabled = false, fullWidth = false, style }: ButtonProps) {
  const { theme } = useUnistyles();
  styles.useVariants({ kind, disabled, fullWidth });

  const iconColor: Record<ButtonKind, string> = {
    primary: theme.colors.onPrimary,
    secondary: theme.colors.primaryText,
    accent: theme.colors.onPrimary,
    danger: theme.colors.danger,
    ghost: theme.colors.primaryText,
  };

  return (
    <PressableScale
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      style={[styles.button, style]}
    >
      {Icon ? <Icon size={20} color={iconColor[kind]} strokeWidth={2.2} /> : null}
      <Text variant="label" tone={TONE[kind]} style={styles.label}>
        {label}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create((theme) => ({
  button: {
    minHeight: 48,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    variants: {
      kind: {
        primary: { backgroundColor: theme.colors.primary },
        secondary: { backgroundColor: theme.colors.primaryMuted },
        accent: { backgroundColor: theme.colors.accent },
        danger: { backgroundColor: theme.colors.dangerMuted },
        ghost: { backgroundColor: 'transparent' },
      },
      disabled: {
        true: { opacity: 0.45 },
        false: { opacity: 1 },
      },
      fullWidth: {
        true: { alignSelf: 'stretch' },
        false: { alignSelf: 'flex-start' },
      },
    },
  },
  label: {
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.semibold,
  },
}));
