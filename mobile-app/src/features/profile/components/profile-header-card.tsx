import { Camera, Pencil } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { haptics } from '@/shared/lib/haptics';
import { useBontonStore } from '@/shared/store/bonton-store';
import { Text, UserAvatar } from '@/shared/ui';

interface ProfileHeaderCardProps {
  onEditPress: () => void;
  onAvatarPress: () => void;
}

export function ProfileHeaderCard({ onEditPress, onAvatarPress }: ProfileHeaderCardProps) {
  const { theme } = useUnistyles();
  const userName = useBontonStore((s) => s.userName);
  const userBio = useBontonStore((s) => s.userBio);
  const userAvatar = useBontonStore((s) => s.userAvatar);

  const handleEditName = () => {
    haptics.tap();
    onEditPress();
  };

  const handleAvatarChange = () => {
    haptics.tap();
    onAvatarPress();
  };

  return (
    <View style={styles.container}>
      {/* Edit pencil button at top right for editing name */}
      <View style={styles.topActionRow}>
        <Pressable
          onPress={handleEditName}
          hitSlop={12}
          accessibilityLabel="Edit name and bio"
          style={({ pressed }) => [
            styles.editIconButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Pencil size={18} color={theme.colors.text} />
        </Pressable>
      </View>

      {/* Centered Avatar (Pressable to change photo) */}
      <View style={styles.avatarWrapper}>
        <Pressable
          onPress={handleAvatarChange}
          style={({ pressed }) => [
            styles.avatarShadowWrapper,
            pressed && styles.buttonPressed,
          ]}
        >
          <View style={styles.avatarCircle}>
            <UserAvatar
              avatar={userAvatar}
              size={104}
              iconSize={54}
              iconColor={theme.isDark ? theme.colors.text : theme.colors.primary}
            />
          </View>
        </Pressable>

        {/* Camera badge at bottom right */}
        <Pressable
          onPress={handleAvatarChange}
          hitSlop={6}
          accessibilityLabel="Change profile photo"
          style={({ pressed }) => [
            styles.cameraBadge,
            pressed && styles.buttonPressed,
          ]}
        >
          <Camera size={14} color={theme.colors.onPrimary} strokeWidth={2.4} />
        </Pressable>
      </View>

      {/* Name and Tagline */}
      <View style={styles.infoWrapper}>
        <Text variant="title" style={styles.userName}>
          {userName}
        </Text>
        <Text variant="caption" tone="secondary" style={styles.userBio}>
          {userBio}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    alignItems: 'center',
    paddingTop: theme.spacing.xs,
    paddingBottom: theme.spacing.md,
  },
  topActionRow: {
    width: '100%',
    alignItems: 'flex-end',
    marginBottom: theme.spacing.sm,
  },
  editIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: theme.isDark ? 0.3 : 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: theme.spacing.md,
  },
  avatarShadowWrapper: {
    width: 108,
    height: 108,
    borderRadius: 54,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: theme.isDark ? 0.4 : 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  avatarCircle: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    borderWidth: 2,
    borderColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  infoWrapper: {
    alignItems: 'center',
    gap: 4,
  },
  userName: {
    fontSize: 26,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.text,
  },
  userBio: {
    fontSize: 13,
    textAlign: 'center',
  },
}));
