import type { LucideIcon } from 'lucide-react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { haptics } from '@/shared/lib/haptics';

import { PressableScale } from './pressable-scale';

export interface IconButtonProps {
  icon: LucideIcon;
  /** Required: icon-only controls need an accessible name. */
  label: string;
  onPress: () => void;
  tone?: 'default' | 'primary' | 'danger';
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export function IconButton({ icon: Icon, label, onPress, tone = 'default', size = 22, style }: IconButtonProps) {
  const { theme } = useUnistyles();
  const color =
    tone === 'primary' ? theme.colors.primaryText : tone === 'danger' ? theme.colors.danger : theme.colors.textSecondary;

  return (
    <PressableScale
      accessibilityLabel={label}
      hitSlop={6}
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      style={[styles.button, style]}
    >
      <Icon size={size} color={color} strokeWidth={2} />
    </PressableScale>
  );
}

const styles = StyleSheet.create((theme) => ({
  button: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
