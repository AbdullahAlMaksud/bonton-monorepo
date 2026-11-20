import type { StyleProp, ViewStyle } from 'react-native';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { StyleSheet } from 'react-native-unistyles';

import { withTheme, type WithTheme } from '@/shared/theme/with-theme';

export interface WavyHeaderProps {
  height?: number | `${number}%` | '100%';
  style?: StyleProp<ViewStyle>;
  variant?: 'standard' | 'tall';
}

function WavyHeaderComponent({
  height = 230,
  style,
  variant = 'standard',
  theme,
  rt,
}: WithTheme<WavyHeaderProps>) {
  const isNumericHeight = typeof height === 'number';
  const totalHeight = isNumericHeight ? height + rt.insets.top : height;

  const isDark = theme.isDark;

  // Multilayered gradient stops fully bound to active theme colors
  const gradientStops = isDark
    ? {
      start: theme.colors.card,
      middle: '#18181B',
      end: '#27272A',
      accentWave: theme.colors.accent,
    }
    : {
      start: theme.colors.primary,
      middle: theme.colors.secondaryMuted,
      end: theme.colors.primary,
      accentWave: theme.colors.accent,
    };

  const isTall = variant === 'tall';

  return (
    <View
      style={[
        styles.container,
        totalHeight ? { height: totalHeight } : null,
        style,
      ]}
      pointerEvents="none"
    >
      <Svg
        width="100%"
        height="100%"
        viewBox={isTall ? '0 0 400 320' : '0 0 400 240'}
        preserveAspectRatio="none"
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          {/* Main Primary Wave Gradient */}
          <LinearGradient id="wavyHeaderPrimaryGradient" x1="70%" y1="10%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={gradientStops.start} stopOpacity="1" />
            <Stop offset="40%" stopColor={gradientStops.middle} stopOpacity="1" />
            <Stop offset="100%" stopColor={gradientStops.end} stopOpacity="1" />
          </LinearGradient>

          {/* Accent Wave Gradient (lighter accent/secondary) */}
          <LinearGradient id="wavyHeaderAccentGradient" x1="100%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={gradientStops.accentWave} stopOpacity="0.60" />
            <Stop offset="100%" stopColor={gradientStops.middle} stopOpacity="0.15" />
          </LinearGradient>
        </Defs>

        {isTall ? (
          <>
            {/* Layer 1: Background accent wave (curves gently at the bottom) */}
            <Path
              d="M 0 0 L 400 0 L 400 265 C 330 300 260 240 170 285 C 90 315 30 275 0 295 Z"
              fill="url(#wavyHeaderAccentGradient)"
            />

            {/* Layer 2: Main primary wave (curves gently at the bottom) */}
            <Path
              d="M 0 0 L 400 0 L 400 240 C 310 285 230 225 140 265 C 70 295 20 260 0 270 Z"
              fill="url(#wavyHeaderPrimaryGradient)"
            />
          </>
        ) : (
          <>
            {/* Layer 1: Background accent wave */}
            <Path
              d="M 0 0 L 400 0 L 400 185 C 330 220 260 160 170 205 C 90 235 30 195 0 215 Z"
              fill="url(#wavyHeaderAccentGradient)"
            />

            {/* Layer 2: Main primary wave */}
            <Path
              d="M 0 0 L 400 0 L 400 160 C 310 205 230 145 140 185 C 70 215 20 180 0 190 Z"
              fill="url(#wavyHeaderPrimaryGradient)"
            />
          </>
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
});

export const WavyHeader = withTheme(WavyHeaderComponent);
