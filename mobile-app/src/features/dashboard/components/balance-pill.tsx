import { useEffect, useRef, useState } from 'react';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { useFormatters } from '@/shared/hooks/use-formatters';
import { haptics } from '@/shared/lib/haptics';
import { CURRENCIES } from '@/shared/lib/money';
import { useBontonStore } from '@/shared/store/bonton-store';
import { PressableScale, Text } from '@/shared/ui';

interface BalancePillProps {
  netBalance: number;
}

export function BalancePill({ netBalance }: BalancePillProps) {
  const currency = useBontonStore((s) => s.currency);
  const fmt = useFormatters();

  const [isRevealed, setIsRevealed] = useState(false);
  const progress = useSharedValue(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currencySymbol = CURRENCIES[currency]?.symbol ?? '৳';

  // Format the actual balance
  const balanceText = `${netBalance > 0 ? '+' : ''}${fmt.money(netBalance)}`;

  const labelText = 'ব্যালেন্স দেখুন';

  const toggleReveal = () => {
    haptics.select();

    if (isRevealed) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      progress.value = withTiming(0, { duration: 240 });
      setIsRevealed(false);
    } else {
      progress.value = withSpring(1, {
        damping: 15,
        stiffness: 180,
        mass: 0.8,
      });
      setIsRevealed(true);

      // Auto-hide after 5 seconds as requested by the user
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        progress.value = withTiming(0, { duration: 280 });
        setIsRevealed(false);
        timerRef.current = null;
      }, 5000);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Hidden label ("ব্যালেন্স দেখুন") animation
  const hiddenLabelStyle = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [0, 0.45], [1, 0]);
    const translateY = interpolate(progress.value, [0, 0.45], [0, -7]);
    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  // Revealed balance animation
  const revealedValueStyle = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [0.45, 1], [0, 1]);
    const translateY = interpolate(progress.value, [0.45, 1], [7, 0]);
    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  // Switch button icon animation
  const switchKnobStyle = useAnimatedStyle(() => {
    const scale = interpolate(progress.value, [0, 0.5, 1], [1, 1.14, 1]);
    const rotate = `${interpolate(progress.value, [0, 1], [0, 360])}deg`;
    return {
      transform: [{ scale }, { rotate }],
    };
  });

  return (
    <PressableScale
      scaleTo={0.96}
      onPress={toggleReveal}
      accessibilityRole="button"
      accessibilityLabel={isRevealed ? balanceText : labelText}
      style={styles.pillContainer}
    >
      {/* Center text area with animated cross-fade */}
      <View style={styles.textSlot}>
        <Animated.View
          style={[styles.absoluteTextRow, hiddenLabelStyle]}
          pointerEvents={isRevealed ? 'none' : 'auto'}
        >
          <Text style={styles.hiddenLabelText}>{labelText}</Text>
        </Animated.View>

        <Animated.View
          style={[styles.absoluteTextRow, revealedValueStyle]}
          pointerEvents={isRevealed ? 'auto' : 'none'}
        >
          <Text style={styles.revealedBalanceText}>{balanceText}</Text>
        </Animated.View>
      </View>

      {/* Switch knob with money symbol (টাকার চিহ্ন যুক্ত সুইচ) */}
      <Animated.View
        style={[
          styles.switchKnob,
          isRevealed ? styles.switchKnobActive : styles.switchKnobInactive,
          switchKnobStyle,
        ]}
      >
        <Text style={styles.switchSymbolText}>{currencySymbol}</Text>
      </Animated.View>
    </PressableScale>
  );
}

const styles = StyleSheet.create((theme) => ({
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: theme.isDark ? theme.colors.card : 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: theme.isDark ? theme.colors.border : 'rgba(255, 255, 255, 0.32)',
    borderRadius: theme.radius.pill,
    paddingLeft: theme.spacing.md,
    paddingRight: theme.spacing.xs,
    paddingVertical: 3,
    minHeight: 32,
    gap: theme.spacing.sm,
  },
  textSlot: {
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 84,
  },
  absoluteTextRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hiddenLabelText: {
    color: theme.isDark ? theme.colors.text : theme.colors.onPrimary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.semibold,
    letterSpacing: 0.2,
  },
  revealedBalanceText: {
    color: theme.isDark ? theme.colors.text : theme.colors.onPrimary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.bold,
    letterSpacing: 0.3,
  },
  switchKnob: {
    width: 22,
    height: 22,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  switchKnobInactive: {
    backgroundColor: theme.isDark ? theme.colors.primaryMuted : 'rgba(255, 255, 255, 0.24)',
    borderColor: theme.isDark ? theme.colors.border : 'rgba(255, 255, 255, 0.45)',
  },
  switchKnobActive: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
    ...theme.shadows.sm,
  },
  switchSymbolText: {
    color: theme.colors.onPrimary,
    fontSize: 12,
    fontWeight: theme.typography.weight.bold,
    marginTop: -1,
  },
}));
