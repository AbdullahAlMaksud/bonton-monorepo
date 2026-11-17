import { House, Plane, Sparkles, Utensils, Wallet, type LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import type { GroupIconName } from '@/shared/types/bonton';

export const GROUP_ICONS: Record<GroupIconName, LucideIcon> = {
  wallet: Wallet,
  plane: Plane,
  utensils: Utensils,
  home: House,
  sparkles: Sparkles,
};

export interface GroupIconProps {
  name: GroupIconName;
  size?: 'md' | 'lg';
  selected?: boolean;
}

export function GroupIcon({ name, size = 'md', selected = false }: GroupIconProps) {
  const { theme } = useUnistyles();
  styles.useVariants({ size, selected });
  const Icon = GROUP_ICONS[name];
  const iconSize = size === 'lg' ? 28 : 22;

  return (
    <View style={styles.well} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Icon size={iconSize} color={selected ? theme.colors.onPrimary : theme.colors.primaryText} strokeWidth={2} />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  well: {
    alignItems: 'center',
    justifyContent: 'center',
    variants: {
      size: {
        md: { width: 44, height: 44, borderRadius: theme.radius.md },
        lg: { width: 56, height: 56, borderRadius: theme.radius.lg },
      },
      selected: {
        true: { backgroundColor: theme.colors.primary },
        false: { backgroundColor: theme.colors.primaryMuted },
      },
    },
  },
}));
