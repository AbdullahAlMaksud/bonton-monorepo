import { X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { haptics } from '@/shared/lib/haptics';

import { PressableScale } from './pressable-scale';
import { Text } from './text';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  /** When set, a trailing "x" removes the chip (member chips). */
  onRemove?: () => void;
  removeLabel?: string;
  leading?: ReactNode;
}

export function Chip({ label, selected = false, onPress, onRemove, removeLabel, leading }: ChipProps) {
  const { theme } = useUnistyles();
  styles.useVariants({ selected });

  return (
    <View style={styles.chip}>
      <PressableScale
        accessibilityLabel={label}
        accessibilityRole={onPress ? 'checkbox' : undefined}
        accessibilityState={{ selected }}
        disabled={!onPress}
        scaleTo={0.95}
        onPress={() => {
          haptics.select();
          onPress?.();
        }}
        style={styles.body}
      >
        {leading}
        <Text variant="label" tone={selected ? 'primary' : 'default'}>
          {label}
        </Text>
      </PressableScale>
      {onRemove ? (
        <PressableScale
          accessibilityLabel={removeLabel ?? label}
          hitSlop={8}
          onPress={() => {
            haptics.tap();
            onRemove();
          }}
          style={styles.remove}
        >
          <X size={16} color={theme.colors.textSecondary} strokeWidth={2.4} />
        </PressableScale>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    variants: {
      selected: {
        true: { backgroundColor: theme.colors.primaryMuted, borderColor: theme.colors.primary },
        false: { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
      },
    },
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    minHeight: 40,
  },
  remove: {
    width: 32,
    height: 32,
    marginRight: 4,
    marginLeft: -8,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
