import {
  Crown,
  Heart,
  Rocket,
  Shield,
  Smile,
  Sparkles,
  Star,
  Target,
  User,
  Zap,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Image, type ImageStyle, type StyleProp, View, type ViewStyle } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

export const AVATAR_ICON_MAP: Record<string, LucideIcon> = {
  user: User,
  target: Target,
  sparkles: Sparkles,
  rocket: Rocket,
  star: Star,
  smile: Smile,
  zap: Zap,
  shield: Shield,
  crown: Crown,
  heart: Heart,
};

export const AVATAR_PRESETS = [
  { id: 'preset_user', name: 'user', icon: User, label: 'Default' },
  { id: 'preset_target', name: 'target', icon: Target, label: 'Target' },
  { id: 'preset_sparkles', name: 'sparkles', icon: Sparkles, label: 'Sparkles' },
  { id: 'preset_rocket', name: 'rocket', icon: Rocket, label: 'Rocket' },
  { id: 'preset_star', name: 'star', icon: Star, label: 'Star' },
  { id: 'preset_smile', name: 'smile', icon: Smile, label: 'Smile' },
  { id: 'preset_zap', name: 'zap', icon: Zap, label: 'Energy' },
  { id: 'preset_shield', name: 'shield', icon: Shield, label: 'Shield' },
  { id: 'preset_crown', name: 'crown', icon: Crown, label: 'Crown' },
] as const;

// Legacy emoji to icon mapper so existing saved states seamlessly show clean icons
const EMOJI_TO_ICON: Record<string, LucideIcon> = {
  '🎯': Target,
  '🚀': Rocket,
  '⭐': Star,
  '✨': Sparkles,
  '😎': Smile,
  '🌿': Sparkles,
};

export interface UserAvatarProps {
  avatar?: string | null;
  size?: number;
  iconSize?: number;
  iconColor?: string;
  strokeWidth?: number;
  borderWidth?: number;
  borderColor?: string;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
}

export function UserAvatar({
  avatar,
  size = 40,
  iconSize,
  iconColor,
  strokeWidth = 2,
  borderWidth,
  borderColor,
  backgroundColor,
  style,
  imageStyle,
}: UserAvatarProps) {
  const { theme } = useUnistyles();
  const radius = Math.round(size / 2);
  const resolvedIconSize = iconSize ?? Math.round(size * 0.52);
  const resolvedIconColor = iconColor ?? theme.colors.primary;

  const isImageUri =
    avatar &&
    !avatar.startsWith('icon:') &&
    !avatar.startsWith('emoji:');

  if (isImageUri) {
    return (
      <View
        style={[
          styles.container,
          {
            width: size,
            height: size,
            borderRadius: radius,
            backgroundColor: backgroundColor ?? theme.colors.card,
          },
          borderWidth !== undefined ? { borderWidth } : null,
          borderColor !== undefined ? { borderColor } : null,
          style,
        ]}
      >
        <Image
          source={{ uri: avatar }}
          style={[
            styles.image,
            {
              width: size,
              height: size,
              borderRadius: radius,
            },
            imageStyle,
          ]}
          resizeMode="cover"
        />
      </View>
    );
  }

  // Determine icon component
  let IconComponent: LucideIcon = User;
  if (avatar?.startsWith('icon:')) {
    const key = avatar.replace('icon:', '');
    IconComponent = AVATAR_ICON_MAP[key] ?? User;
  } else if (avatar?.startsWith('emoji:')) {
    const emoji = avatar.replace('emoji:', '');
    IconComponent = EMOJI_TO_ICON[emoji] ?? User;
  }

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: backgroundColor ?? 'transparent',
        },
        borderWidth !== undefined ? { borderWidth } : null,
        borderColor !== undefined ? { borderColor } : null,
        style,
      ]}
    >
      <IconComponent
        size={resolvedIconSize}
        color={resolvedIconColor}
        strokeWidth={strokeWidth}
      />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
}));
