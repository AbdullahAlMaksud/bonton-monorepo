import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { useUnistyles } from 'react-native-unistyles';

export interface WavyHeaderProps {
  height?: number;
}

export function WavyHeader({ height = 230 }: WavyHeaderProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useUnistyles();

  const totalHeight = height + insets.top;

  // Gray shades gradient for wavy header
  const isDark = theme.isDark;
  const gradientStops = isDark
    ? {
        start: '#000000',
        middle: '#18181B',
        end: '#27272A',
        accentWave: '#3F3F46',
      }
    : {
        start: '#0F172A',
        middle: '#1E293B',
        end: '#334155',
        accentWave: '#64748B',
      };

  return (
    <View style={[styles.container, { height: totalHeight }]} pointerEvents="none">
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 400 240"
        preserveAspectRatio="none"
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          {/* Main Gray Wave Gradient */}
          <LinearGradient id="grayWaveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={gradientStops.start} stopOpacity="1" />
            <Stop offset="55%" stopColor={gradientStops.middle} stopOpacity="1" />
            <Stop offset="100%" stopColor={gradientStops.end} stopOpacity="1" />
          </LinearGradient>

          {/* Accent Wave Gradient (lighter gray/ash) */}
          <LinearGradient id="accentWaveGradient" x1="100%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={gradientStops.accentWave} stopOpacity="0.4" />
            <Stop offset="100%" stopColor={gradientStops.middle} stopOpacity="0.1" />
          </LinearGradient>
        </Defs>

        {/* Layer 1: Background accent wave */}
        <Path
          d="M 0 0 L 400 0 L 400 185 C 330 220 260 160 170 205 C 90 235 30 195 0 215 Z"
          fill="url(#accentWaveGradient)"
        />

        {/* Layer 2: Main primary wave */}
        <Path
          d="M 0 0 L 400 0 L 400 160 C 310 205 230 145 140 185 C 70 215 20 180 0 190 Z"
          fill="url(#grayWaveGradient)"
        />
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
