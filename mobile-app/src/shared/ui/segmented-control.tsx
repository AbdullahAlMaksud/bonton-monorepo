import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { haptics } from '@/shared/lib/haptics';

import { PressableScale } from './pressable-scale';
import { Text } from './text';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  options: ReadonlyArray<SegmentOption<T>>;
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({ options, value, onChange }: SegmentedControlProps<T>) {
  return (
    <View style={styles.track} accessibilityRole="tablist">
      {options.map((option) => (
        <Segment
          key={option.value}
          label={option.label}
          selected={option.value === value}
          onPress={() => {
            if (option.value === value) return;
            haptics.select();
            onChange(option.value);
          }}
        />
      ))}
    </View>
  );
}

interface SegmentProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

function Segment({ label, selected, onPress }: SegmentProps) {
  styles.useVariants({ selected });
  return (
    <PressableScale
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      scaleTo={0.97}
      onPress={onPress}
      style={styles.segment}
    >
      <Text variant="label" tone={selected ? 'onPrimary' : 'secondary'} numberOfLines={1}>
        {label}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create((theme) => ({
  track: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    minHeight: 40,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.sm,
    variants: {
      selected: {
        true: { backgroundColor: theme.colors.primary },
        false: { backgroundColor: 'transparent' },
      },
    },
  },
}));
