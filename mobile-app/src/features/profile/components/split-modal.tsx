import { GitFork, Percent, Sliders, Users, X } from 'lucide-react-native';
import { Pressable, ScrollView, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useTranslation } from 'react-i18next';

import { haptics } from '@/shared/lib/haptics';
import { useBontonStore } from '@/shared/store/bonton-store';
import type { SplitType } from '@/shared/types/bonton';
import { BottomSheetModal, Button, Text } from '@/shared/ui';

interface SplitModalProps {
  visible: boolean;
  onClose: () => void;
}

interface SplitOptionConfig {
  id: SplitType;
  titleKey: 'profile.splitEqualTitle' | 'profile.splitPercentageTitle' | 'profile.splitCustomTitle';
  descKey: 'profile.splitEqualDesc' | 'profile.splitPercentageDesc' | 'profile.splitCustomDesc';
  icon: typeof Users;
}

const SPLIT_OPTIONS: SplitOptionConfig[] = [
  {
    id: 'equal',
    titleKey: 'profile.splitEqualTitle',
    descKey: 'profile.splitEqualDesc',
    icon: Users,
  },
  {
    id: 'percentage',
    titleKey: 'profile.splitPercentageTitle',
    descKey: 'profile.splitPercentageDesc',
    icon: Percent,
  },
  {
    id: 'custom',
    titleKey: 'profile.splitCustomTitle',
    descKey: 'profile.splitCustomDesc',
    icon: Sliders,
  },
];

export function SplitModal({ visible, onClose }: SplitModalProps) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const defaultSplitType = useBontonStore((s) => s.defaultSplitType);
  const setDefaultSplitType = useBontonStore((s) => s.setDefaultSplitType);

  const handleSelect = (id: SplitType) => {
    haptics.select();
    setDefaultSplitType(id);
  };

  const handleDone = () => {
    haptics.tap();
    onClose();
  };

  return (
    <BottomSheetModal visible={visible} onClose={onClose}>
      {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconContainer}>
                <GitFork size={22} color={theme.colors.primary} />
              </View>
              <View style={styles.headerTextGroup}>
                <Text variant="heading" style={styles.headerTitle}>
                  {t('profile.splitModalTitle')}
                </Text>
                <Text variant="caption" tone="secondary">
                  {t('profile.splitModalSubtitle')}
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

          {/* Options list */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          >
            {SPLIT_OPTIONS.map((item) => {
              const isSelected = defaultSplitType === item.id;
              const Icon = item.icon;

              return (
                <Pressable
                  key={item.id}
                  onPress={() => handleSelect(item.id)}
                  style={({ pressed }) => [
                    styles.optionItem,
                    isSelected && styles.optionItemSelected,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <View style={styles.optionLeft}>
                    <View
                      style={[
                        styles.optionIconContainer,
                        isSelected && styles.optionIconContainerSelected,
                      ]}
                    >
                      <Icon
                        size={20}
                        color={
                          isSelected ? theme.colors.primary : theme.colors.textSecondary
                        }
                      />
                    </View>
                    <View style={styles.optionTextGroup}>
                      <Text
                        variant="body"
                        style={[
                          styles.optionTitle,
                          isSelected && styles.optionTitleSelected,
                        ]}
                      >
                        {t(item.titleKey)}
                      </Text>
                      <Text variant="caption" tone="secondary">
                        {t(item.descKey)}
                      </Text>
                    </View>
                  </View>

                  {/* Radio Indicator */}
                  <View
                    style={[
                      styles.radioCircle,
                      isSelected && styles.radioCircleSelected,
                    ]}
                  >
                    {isSelected && <View style={styles.radioDot} />}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Bottom Complete Button */}
          <View style={styles.footer}>
            <Button
              label={t('profile.done')}
              kind="primary"
              fullWidth
              onPress={handleDone}
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
  optionItemSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryMuted,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconContainerSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.background,
  },
  optionTextGroup: {
    flex: 1,
    gap: 2,
  },
  optionTitle: {
    fontWeight: theme.typography.weight.medium,
  },
  optionTitleSelected: {
    fontWeight: theme.typography.weight.bold,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: theme.colors.primary,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
  },
  footer: {
    marginTop: theme.spacing.lg,
  },
}));
