import { UserPen, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useTranslation } from 'react-i18next';

import { haptics } from '@/shared/lib/haptics';
import { useBontonStore } from '@/shared/store/bonton-store';
import { BottomSheetModal, Button, Text, TextField } from '@/shared/ui';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

export function EditProfileModal({ visible, onClose }: EditProfileModalProps) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const userName = useBontonStore((s) => s.userName);
  const userBio = useBontonStore((s) => s.userBio);
  const setUserName = useBontonStore((s) => s.setUserName);
  const setUserBio = useBontonStore((s) => s.setUserBio);

  const [name, setName] = useState(userName);
  const [bio, setBio] = useState(userBio);

  const handleSave = () => {
    haptics.success();
    setUserName(name.trim() || 'মাকসুদ');
    setUserBio(bio.trim() || 'সহজ হিসাব, সুন্দর বন্ধুত্ব।');
    onClose();
  };

  return (
    <BottomSheetModal visible={visible} onClose={onClose}>
      {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconContainer}>
                <UserPen size={22} color={theme.colors.primary} />
              </View>
              <View style={styles.headerTextGroup}>
                <Text variant="heading" style={styles.headerTitle}>
                  {t('profile.editProfile')}
                </Text>
                <Text variant="caption" tone="secondary">
                  {t('profile.subtitle')}
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

      {/* Form & Footer inside keyboard-scrollable container */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <View style={styles.form}>
          <TextField
            label={t('profile.namePrompt')}
            value={name}
            onChangeText={setName}
            placeholder="যেমন: মাকসুদ"
            autoFocus
          />

          <TextField
            label={t('profile.bioPrompt')}
            value={bio}
            onChangeText={setBio}
            placeholder="আপনার ছোট স্লোগান বা স্ট্যাটাস"
          />
        </View>

        <View style={styles.footer}>
          <Button
            label={t('common.save')}
            kind="primary"
            fullWidth
            onPress={handleSave}
          />
        </View>
      </ScrollView>
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
  },
  form: {
    gap: theme.spacing.md,
    marginVertical: theme.spacing.sm,
  },
  footer: {
    marginTop: theme.spacing.lg,
  },
}));
