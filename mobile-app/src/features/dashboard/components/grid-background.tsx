import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Pattern, Rect } from 'react-native-svg';
import { useUnistyles } from 'react-native-unistyles';

export interface GridBackgroundProps {
  /** Spacing between dots in pixels (default: 24) */
  size?: number;
  /** Radius of each dot in pixels (default: 1.2) */
  dotRadius?: number;
  /** Custom opacity override (default: light 0.08, dark 0.11) */
  opacity?: number;
}

export function GridBackground({
  size = 24,
  dotRadius = 1.2,
  opacity,
}: GridBackgroundProps) {
  const { theme } = useUnistyles();

  // Color adapted for theme (pure black on light, pure white on dark)
  const dotColor = theme.isDark ? '#FFFFFF' : '#000000';

  // Subtle, soft opacity as requested
  const dotOpacity = opacity ?? (theme.isDark ? 0.11 : 0.08);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern
            id="dot-matrix"
            width={size}
            height={size}
            patternUnits="userSpaceOnUse"
          >
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={dotRadius}
              fill={dotColor}
              fillOpacity={dotOpacity}
            />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#dot-matrix)" />
      </Svg>
    </View>
  );
}

// Export DotBackground alias as well
export const DotBackground = GridBackground;
