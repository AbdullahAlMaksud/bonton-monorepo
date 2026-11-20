import React from 'react';
import { StyleSheet as RNStyleSheet, Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { toBengaliDigits } from '@/shared/lib/money';
import { useBontonStore } from '@/shared/store/bonton-store';
import { getFontFamily } from '@/shared/theme/fonts';

export type TextVariant = 'display' | 'title' | 'heading' | 'body' | 'label' | 'caption';
export type TextTone = 'default' | 'secondary' | 'primary' | 'accent' | 'success' | 'danger' | 'warning' | 'onPrimary';

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  tone?: TextTone;
  align?: 'left' | 'center' | 'right';
}

function localizeNode(node: React.ReactNode, isBn: boolean): React.ReactNode {
  if (!isBn || node === null || node === undefined) return node;
  if (typeof node === 'string') {
    return toBengaliDigits(node);
  }
  if (typeof node === 'number') {
    return toBengaliDigits(node);
  }
  if (Array.isArray(node)) {
    return React.Children.map(node, (child) => localizeNode(child, isBn));
  }
  return node;
}

export function Text({ variant = 'body', tone = 'default', align, style, children, ...rest }: TextProps) {
  // `default` is a reserved variant key in Unistyles, so the default tone is "no variant".
  styles.useVariants({ variant, tone: tone === 'default' ? undefined : tone });
  const activeFont = useBontonStore((s) => s.font);
  const language = useBontonStore((s) => s.language);

  const flatStyle = RNStyleSheet.flatten(style);
  const isBoldVariant = variant === 'display' || variant === 'title' || variant === 'heading';
  const weight = flatStyle?.fontWeight || (isBoldVariant ? 'bold' : 'normal');
  const resolvedFontFamily = flatStyle?.fontFamily || getFontFamily(activeFont, weight);

  const localizedChildren = localizeNode(children, language === 'bn');

  return (
    <RNText
      {...rest}
      style={[
        styles.text,
        resolvedFontFamily ? { fontFamily: resolvedFontFamily } : null,
        align ? { textAlign: align } : null,
        style,
      ]}
    >
      {localizedChildren}
    </RNText>
  );
}

const styles = StyleSheet.create((theme) => ({
  text: {
    color: theme.colors.text,
    fontSize: theme.typography.size.md,
    lineHeight: theme.typography.lineHeight.md,
    fontWeight: theme.typography.weight.regular,
    variants: {
      variant: {
        display: {
          fontSize: theme.typography.size.display,
          lineHeight: theme.typography.lineHeight.display,
          fontWeight: theme.typography.weight.bold,
        },
        title: {
          fontSize: theme.typography.size.xxl,
          lineHeight: theme.typography.lineHeight.xxl,
          fontWeight: theme.typography.weight.bold,
        },
        heading: {
          fontSize: theme.typography.size.lg,
          lineHeight: theme.typography.lineHeight.lg,
          fontWeight: theme.typography.weight.semibold,
        },
        body: {},
        label: {
          fontSize: theme.typography.size.sm,
          lineHeight: theme.typography.lineHeight.sm,
          fontWeight: theme.typography.weight.medium,
        },
        caption: {
          fontSize: theme.typography.size.xs,
          lineHeight: theme.typography.lineHeight.xs,
        },
      },
      tone: {
        secondary: { color: theme.colors.textSecondary },
        primary: { color: theme.colors.primaryText },
        accent: { color: theme.colors.accentText },
        success: { color: theme.colors.success },
        danger: { color: theme.colors.danger },
        warning: { color: theme.colors.warning },
        onPrimary: { color: theme.colors.onPrimary },
      },
    },
  },
}));
