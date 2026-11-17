import type { LucideIcon } from 'lucide-react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { haptics } from '@/shared/lib/haptics';

import { PressableScale } from './pressable-scale';

export interface FabProps {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  /** Distance from the bottom edge of the screen area. Tab screens already sit above the tab bar. */
  bottomOffset?: number;
}

export function Fab({ icon: Icon, label, onPress, bottomOffset = 0 }: FabProps) {
  const { theme } = useUnistyles();
  return (
    <Animated.View
      entering={ZoomIn.springify().damping(16).delay(150)}
      style={styles.anchor(bottomOffset)}
      pointerEvents="box-none"
    >
      <PressableScale
        accessibilityLabel={label}
        scaleTo={0.92}
        onPress={() => {
          haptics.tap();
          onPress();
        }}
        style={styles.fab}
      >
        <Icon size={28} color={theme.colors.onPrimary} strokeWidth={2.4} />
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create((theme) => ({
  anchor: (bottomOffset: number) => ({
    position: 'absolute',
    right: theme.spacing.lg,
    bottom: theme.spacing.lg + bottomOffset,
  }),
  fab: {
    width: 60,
    height: 60,
    borderRadius: theme.radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    ...theme.shadows.md,
  },
}));
