import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Text } from './text';

export interface AvatarProps {
  name: string;
  size?: number;
  highlight?: boolean;
}

/** First grapheme of the name — works for Latin and Bengali (conjunct-safe via Array.from). */
function initialOf(name: string): string {
  const first = Array.from(name.trim())[0];
  return first ? first.toLocaleUpperCase() : '?';
}

export function Avatar({ name, size = 40, highlight = false }: AvatarProps) {
  styles.useVariants({ highlight });
  return (
    <View
      style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Text variant="label" tone={highlight ? 'onPrimary' : 'primary'}>
        {initialOf(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    variants: {
      highlight: {
        true: { backgroundColor: theme.colors.primary },
        false: { backgroundColor: theme.colors.primaryMuted },
      },
    },
  },
}));
