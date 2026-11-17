import type { ReactNode } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Text } from '@/shared/ui';

export interface FormSectionProps {
  title: string;
  hint?: string;
  children: ReactNode;
}

export function FormSection({ title, hint, children }: FormSectionProps) {
  return (
    <View style={styles.section}>
      <View>
        <Text variant="heading">{title}</Text>
        {hint ? (
          <Text variant="caption" tone="secondary">
            {hint}
          </Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  section: {
    gap: theme.spacing.md,
  },
}));
