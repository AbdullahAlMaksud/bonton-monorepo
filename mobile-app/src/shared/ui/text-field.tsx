import { useState } from 'react';
import { TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { Text } from './text';

export interface TextFieldProps extends Omit<TextInputProps, 'style' | 'placeholderTextColor'> {
  label?: string;
  error?: string | null;
  prefix?: string;
  suffix?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export function TextField({ label, error, prefix, suffix, containerStyle, onFocus, onBlur, ...rest }: TextFieldProps) {
  const { theme } = useUnistyles();
  const [focused, setFocused] = useState(false);
  const invalid = Boolean(error);
  styles.useVariants({ focused, invalid });

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? (
        <Text variant="label" tone="secondary">
          {label}
        </Text>
      ) : null}
      <View style={styles.field}>
        {prefix ? (
          <Text tone="secondary" style={styles.affix}>
            {prefix}
          </Text>
        ) : null}
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={theme.colors.textSecondary}
          selectionColor={theme.colors.primary}
          cursorColor={theme.colors.primary}
          {...rest}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          style={styles.input}
        />
        {suffix ? (
          <Text tone="secondary" style={styles.affix}>
            {suffix}
          </Text>
        ) : null}
      </View>
      {error ? (
        <Text variant="caption" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  wrapper: {
    gap: theme.spacing.xs,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    minHeight: 50,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    backgroundColor: theme.colors.card,
    variants: {
      focused: {
        true: { borderColor: theme.colors.primary },
        false: { borderColor: theme.colors.border },
      },
      invalid: {
        true: { borderColor: theme.colors.danger },
        false: {},
      },
    },
  },
  input: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    color: theme.colors.text,
    fontSize: theme.typography.size.md,
    // Generous line height keeps Bengali conjuncts from being clipped on Android.
    lineHeight: theme.typography.lineHeight.md,
  },
  affix: {
    fontWeight: theme.typography.weight.medium,
  },
}));
