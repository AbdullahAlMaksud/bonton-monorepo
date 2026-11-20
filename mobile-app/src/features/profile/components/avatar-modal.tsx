import { Camera, Image as ImageIcon, Sparkles, Trash2, X } from 'lucide-react-native';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useTranslation } from 'react-i18next';

import { haptics } from '@/shared/lib/haptics';
import { useBontonStore } from '@/shared/store/bonton-store';
import { BottomSheetModal, Button, Text } from '@/shared/ui';

type ImagePickerModule = typeof import('expo-image-picker');

let cachedPicker: ImagePickerModule | null | undefined = undefined;

function getImagePicker(): ImagePickerModule | null {
  if (cachedPicker !== undefined) {
    return cachedPicker;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedPicker = require('expo-image-picker') as ImagePickerModule;
    return cachedPicker;
  } catch {
    cachedPicker = null;
    return null;
  }
}

interface AvatarModalProps {
  visible: boolean;
  onClose: () => void;
}

const PRESET_AVATARS = [
  { id: 'preset_cool', emoji: '😎', label: 'Cool' },
  { id: 'preset_rocket', emoji: '🚀', label: 'Rocket' },
  { id: 'preset_leaf', emoji: '🌿', label: 'Nature' },
  { id: 'preset_star', emoji: '⭐', label: 'Star' },
  { id: 'preset_target', emoji: '🎯', label: 'Focus' },
  { id: 'preset_spark', emoji: '✨', label: 'Spark' },
];

export function AvatarModal({ visible, onClose }: AvatarModalProps) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const userAvatar = useBontonStore((s) => s.userAvatar);
  const setUserAvatar = useBontonStore((s) => s.setUserAvatar);

  const handlePickFromGallery = async () => {
    try {
      haptics.tap();
      const ImagePicker = getImagePicker();
      if (!ImagePicker) {
        Alert.alert(
          t('common.notice', 'Notice'),
          t(
            'profile.imagePickerNotLinked',
            'গ্যালারি ও ক্যামেরা ব্যবহারের জন্য অ্যাপটি রিবিল্ড করা প্রয়োজন। আপনি নিচের পছন্দমতো ডিফল্ট অ্যাভাটারগুলো বেছে নিতে পারেন।'
          )
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        haptics.success();
        setUserAvatar(result.assets[0].uri);
        onClose();
      }
    } catch {
      Alert.alert(
        t('common.error', 'Error'),
        t('profile.imagePickError', 'ছবি নির্বাচন করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'),
      );
    }
  };

  const handleTakePhoto = async () => {
    try {
      haptics.tap();
      const ImagePicker = getImagePicker();
      if (!ImagePicker) {
        Alert.alert(
          t('common.notice', 'Notice'),
          t(
            'profile.imagePickerNotLinked',
            'গ্যালারি ও ক্যামেরা ব্যবহারের জন্য অ্যাপটি রিবিল্ড করা প্রয়োজন। আপনি নিচের পছন্দমতো ডিফল্ট অ্যাভাটারগুলো বেছে নিতে পারেন।'
          )
        );
        return;
      }

      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('common.error', 'Permission Required'),
          t('profile.cameraPermissionError', 'ক্যামেরা ব্যবহারের অনুমতি প্রয়োজন।'),
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        haptics.success();
        setUserAvatar(result.assets[0].uri);
        onClose();
      }
    } catch {
      Alert.alert(
        t('common.error', 'Error'),
        t('profile.cameraError', 'ছবি তুলতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'),
      );
    }
  };

  const handleSelectPreset = (emoji: string) => {
    haptics.select();
    setUserAvatar(`emoji:${emoji}`);
    onClose();
  };

  const handleRemoveAvatar = () => {
    haptics.tap();
    setUserAvatar(null);
    onClose();
  };

  return (
    <BottomSheetModal visible={visible} onClose={onClose}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconContainer}>
            <Camera size={22} color={theme.colors.primary} />
          </View>
          <View style={styles.headerTextGroup}>
            <Text variant="heading" style={styles.headerTitle}>
              {t('profile.avatarModalTitle')}
            </Text>
            <Text variant="caption" tone="secondary">
              {t('profile.avatarModalSubtitle')}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={onClose}
          hitSlop={10}
          style={({ pressed }) => [
            styles.closeButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <X size={18} color={theme.colors.textSecondary} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {/* Option 1: Gallery */}
        <Pressable
          onPress={handlePickFromGallery}
          style={({ pressed }) => [
            styles.optionItem,
            pressed && styles.buttonPressed,
          ]}
        >
          <View style={styles.optionLeft}>
            <View style={styles.optionIconContainer}>
              <ImageIcon size={22} color={theme.colors.primary} />
            </View>
            <View style={styles.optionTextGroup}>
              <Text variant="body" style={styles.optionTitle}>
                {t('profile.chooseFromGallery')}
              </Text>
              <Text variant="caption" tone="secondary">
                {t('profile.chooseFromGalleryDesc')}
              </Text>
            </View>
          </View>
        </Pressable>

        {/* Option 2: Camera */}
        <Pressable
          onPress={handleTakePhoto}
          style={({ pressed }) => [
            styles.optionItem,
            pressed && styles.buttonPressed,
          ]}
        >
          <View style={styles.optionLeft}>
            <View style={styles.optionIconContainer}>
              <Camera size={22} color={theme.colors.primary} />
            </View>
            <View style={styles.optionTextGroup}>
              <Text variant="body" style={styles.optionTitle}>
                {t('profile.takePhoto')}
              </Text>
              <Text variant="caption" tone="secondary">
                {t('profile.takePhotoDesc')}
              </Text>
            </View>
          </View>
        </Pressable>

        {/* Option 3: Presets Section */}
        <View style={styles.presetsSection}>
          <View style={styles.presetsHeaderRow}>
            <Sparkles size={16} color={theme.colors.primary} />
            <Text variant="label" tone="secondary" style={styles.presetsTitle}>
              {t('profile.presetAvatarsTitle')}
            </Text>
          </View>
          <View style={styles.presetsGrid}>
            {PRESET_AVATARS.map((preset) => (
              <Pressable
                key={preset.id}
                onPress={() => handleSelectPreset(preset.emoji)}
                style={({ pressed }) => [
                  styles.presetCircle,
                  userAvatar === `emoji:${preset.emoji}` && styles.presetCircleSelected,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={styles.presetEmoji}>{preset.emoji}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Option 4: Remove Avatar (if an avatar is currently set) */}
        {userAvatar !== null && (
          <Pressable
            onPress={handleRemoveAvatar}
            style={({ pressed }) => [
              styles.optionItem,
              styles.removeOptionItem,
              pressed && styles.buttonPressed,
            ]}
          >
            <View style={styles.optionLeft}>
              <View style={[styles.optionIconContainer, styles.removeIconContainer]}>
                <Trash2 size={20} color={theme.colors.danger} />
              </View>
              <View style={styles.optionTextGroup}>
                <Text variant="body" style={[styles.optionTitle, styles.removeTitle]}>
                  {t('profile.removePhoto')}
                </Text>
                <Text variant="caption" tone="secondary">
                  {t('profile.removePhotoDesc')}
                </Text>
              </View>
            </View>
          </Pressable>
        )}
      </ScrollView>

      {/* Cancel button */}
      <View style={styles.footer}>
        <Button
          label={t('common.cancel', 'Cancel')}
          kind="secondary"
          fullWidth
          onPress={onClose}
        />
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create((theme) => ({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
  },
  headerIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextGroup: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    fontWeight: theme.typography.weight.bold,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
  listContent: {
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
  },
  optionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTextGroup: {
    flex: 1,
    gap: 2,
  },
  optionTitle: {
    fontWeight: theme.typography.weight.semibold,
  },
  presetsSection: {
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  presetsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  presetsTitle: {
    fontWeight: theme.typography.weight.semibold,
  },
  presetsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  presetCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: theme.colors.card,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetCircleSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryMuted,
  },
  presetEmoji: {
    fontSize: 22,
  },
  removeOptionItem: {
    borderColor: theme.colors.dangerMuted,
    backgroundColor: theme.isDark ? '#2A1215' : '#FEF2F2',
  },
  removeIconContainer: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.dangerMuted,
  },
  removeTitle: {
    color: theme.colors.danger,
  },
  footer: {
    marginTop: theme.spacing.sm,
  },
}));
