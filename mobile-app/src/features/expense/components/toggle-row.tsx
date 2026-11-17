import { Switch, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { haptics } from '@/shared/lib/haptics';
import { Text } from '@/shared/ui';

export interface ToggleRowProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

export function ToggleRow({ label, value, onValueChange }: ToggleRowProps) {
  const { theme } = useUnistyles();
  return (
    <View style={styles.row}>
      <Text variant="label" style={styles.label}>
        {label}
      </Text>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={(next) => {
          haptics.select();
          onValueChange(next);
        }}
        trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
        thumbColor={value ? '#FFFFFF' : theme.colors.textSecondary}
        ios_backgroundColor={theme.colors.border}
      />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    minHeight: 44,
  },
  label: {
    flex: 1,
  },
}));
