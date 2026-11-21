import { useState } from 'react';
import { Camera, Check, Image as ImageIcon, Sparkles, Trash2, X } from 'lucide-react-native';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';

import { haptics } from '@/shared/lib/haptics';
import { useBontonStore } from '@/shared/store/bonton-store';
import { AVATAR_PRESETS, BottomSheetModal, Button, PressableScale, Text } from '@/shared/ui';

interface AvatarModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AvatarModal({ visible, onClose }: AvatarModalProps) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const userAvatar = useBontonStore((s) => s.userAvatar);
  const setUserAvatar = useBontonStore((s) => s.setUserAvatar);

  interface FeedbackModalState {
    visible: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  }
  const [feedbackModal, setFeedbackModal] = useState<FeedbackModalState>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const dismissFeedback = () =>
    setFeedbackModal((prev: FeedbackModalState) => ({ ...prev, visible: false }));

  const handlePickFromGallery = async () => {
    try {
      haptics.tap();

      try {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          setFeedbackModal({
            visible: true,
            type: 'info',
            title: t('common.notice', 'অনুমতি প্রয়োজন'),
            message: t(
              'profile.galleryPermissionError',
              'গ্যালারি থেকে ছবি নির্বাচন করার জন্য ফটো পারমিশন প্রয়োজন। অনুগ্রহ করে অ্যাপ সেটিংসে গিয়ে অনুমতি দিন।'
            ),
          });
          return;
        }
      } catch (permErr) {
        console.warn('Media permission request warning:', permErr);
      }

      let result: ImagePicker.ImagePickerResult;
      try {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.85,
        });
      } catch (cropError) {
        console.warn('Native crop activity missing, falling back without crop:', cropError);
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality: 0.85,
        });
      }

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        haptics.success();
        setUserAvatar(result.assets[0].uri);
        onClose();
      }
    } catch (error) {
      console.warn('Image picker error:', error);
      setFeedbackModal({
        visible: true,
        type: 'error',
        title: t('common.error', 'ত্রুটি'),
        message: t('profile.imagePickError', 'ছবি নির্বাচন করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'),
      });
    }
  };

  const handleTakePhoto = async () => {
    try {
      haptics.tap();

      try {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          setFeedbackModal({
            visible: true,
            type: 'info',
            title: t('common.notice', 'অনুমতি প্রয়োজন'),
            message: t('profile.cameraPermissionError', 'ক্যামেরা ব্যবহারের অনুমতি প্রয়োজন। অনুগ্রহ করে অ্যাপ সেটিংসে গিয়ে অনুমতি দিন।'),
          });
          return;
        }
      } catch (permErr) {
        console.warn('Camera permission request warning:', permErr);
      }

      let result: ImagePicker.ImagePickerResult;
      try {
        result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.85,
        });
      } catch (cropError) {
        console.warn('Native camera crop missing, falling back without crop:', cropError);
        result = await ImagePicker.launchCameraAsync({
          allowsEditing: false,
          quality: 0.85,
        });
      }

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        haptics.success();
        setUserAvatar(result.assets[0].uri);
        onClose();
      }
    } catch (error) {
      console.warn('Camera error:', error);
      setFeedbackModal({
        visible: true,
        type: 'error',
        title: t('common.error', 'ত্রুটি'),
        message: t('profile.cameraError', 'ছবি তুলতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'),
      });
    }
  };

  const handleSelectPreset = (iconName: string) => {
    haptics.select();
    if (iconName === 'user') {
      setUserAvatar(null);
    } else {
      setUserAvatar(`icon:${iconName}`);
    }
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
              {t('profile.presetAvatarsTitle', 'অথবা প্রিসেট আইকন বেছে নিন')}
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.presetsScrollContent}
          >
            {AVATAR_PRESETS.map((preset) => {
              const IconComp = preset.icon;
              const isSelected =
                userAvatar === `icon:${preset.name}` ||
                (preset.name === 'user' && !userAvatar) ||
                (preset.name === 'target' && userAvatar === 'emoji:🎯') ||
                (preset.name === 'rocket' && userAvatar === 'emoji:🚀') ||
                (preset.name === 'star' && userAvatar === 'emoji:⭐') ||
                (preset.name === 'sparkles' && userAvatar === 'emoji:✨') ||
                (preset.name === 'smile' && userAvatar === 'emoji:😎');

              return (
                <Pressable
                  key={preset.id}
                  onPress={() => handleSelectPreset(preset.name)}
                  style={({ pressed }) => [
                    styles.presetCircle,
                    isSelected && styles.presetCircleSelected,
                    pressed && styles.buttonPressed,
                  ]}
                  accessibilityLabel={preset.label}
                >
                  <IconComp
                    size={22}
                    color={isSelected ? theme.colors.primary : theme.colors.textSecondary}
                    strokeWidth={2.2}
                  />
                </Pressable>
              );
            })}
          </ScrollView>
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

      {/* Custom In-App Feedback Modal */}
      {feedbackModal.visible && (
        <Modal
          visible={feedbackModal.visible}
          transparent
          statusBarTranslucent
          animationType="fade"
          onRequestClose={dismissFeedback}
        >
          <View style={styles.modalBackdrop}>
            <Pressable
              style={styles.modalDismissArea}
              onPress={dismissFeedback}
            />
            <View style={styles.modalCard}>
              <View
                style={[
                  styles.modalIconContainer,
                  feedbackModal.type === 'success'
                    ? styles.modalIconSuccess
                    : feedbackModal.type === 'error'
                      ? styles.modalIconError
                      : styles.modalIconInfo,
                ]}
              >
                {feedbackModal.type === 'success' ? (
                  <Check size={26} color="#FFFFFF" strokeWidth={3} />
                ) : feedbackModal.type === 'error' ? (
                  <X size={26} color="#FFFFFF" strokeWidth={3} />
                ) : (
                  <Sparkles size={26} color="#FFFFFF" strokeWidth={2.4} />
                )}
              </View>

              <Text style={styles.modalTitleText}>
                {feedbackModal.title}
              </Text>

              <Text style={styles.modalMessageText}>
                {feedbackModal.message}
              </Text>

              <PressableScale
                scaleTo={0.96}
                onPress={dismissFeedback}
                style={styles.modalPrimaryBtn}
              >
                <Text style={styles.modalPrimaryBtnText}>
                  {t('common.ok', 'ঠিক আছে')}
                </Text>
              </PressableScale>
            </View>
          </View>
        </Modal>
      )}
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
  presetsScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  presetCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
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

  /* --- Feedback Modal --- */
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.70)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    zIndex: 999,
  },
  modalDismissArea: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: theme.colors.card,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    paddingHorizontal: 22,
    paddingVertical: 24,
    alignItems: 'center',
    ...theme.shadows.md,
  },
  modalIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalIconSuccess: {
    backgroundColor: '#16A34A',
  },
  modalIconError: {
    backgroundColor: '#DC2626',
  },
  modalIconInfo: {
    backgroundColor: theme.colors.primary,
  },
  modalTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalMessageText: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 22,
  },
  modalPrimaryBtn: {
    width: '100%',
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.onPrimary,
  },
}));
