import { Feather, Moon, Palette, Sun, Trees, Waves, X } from 'lucide-react-native';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useTranslation } from 'react-i18next';

import { haptics } from '@/shared/lib/haptics';
import { useBontonStore } from '@/shared/store/bonton-store';
import type { ThemeName } from '@/shared/theme/themes';
import { Button, Text } from '@/shared/ui';

interface ThemeModalProps {
  visible: boolean;
  onClose: () => void;
}

interface ThemeItemConfig {
  id: ThemeName;
  nameKey:
    | 'profile.lightTheme'
    | 'profile.darkTheme'
    | 'profile.sepiaTheme'
    | 'profile.forestTheme'
    | 'profile.oceanTheme';
  descKey:
    | 'profile.lightThemeSubtitle'
    | 'profile.darkThemeSubtitle'
    | 'profile.sepiaThemeSubtitle'
    | 'profile.forestThemeSubtitle'
    | 'profile.oceanThemeSubtitle';
  icon: typeof Sun;
}

const THEME_OPTIONS: ThemeItemConfig[] = [
  {
    id: 'light',
    nameKey: 'profile.lightTheme',
    descKey: 'profile.lightThemeSubtitle',
    icon: Sun,
  },
  {
    id: 'dark',
    nameKey: 'profile.darkTheme',
    descKey: 'profile.darkThemeSubtitle',
    icon: Moon,
  },
  {
    id: 'sepia',
    nameKey: 'profile.sepiaTheme',
    descKey: 'profile.sepiaThemeSubtitle',
    icon: Feather,
  },
  {
    id: 'forest',
    nameKey: 'profile.forestTheme',
    descKey: 'profile.forestThemeSubtitle',
    icon: Trees,
  },
  {
    id: 'ocean',
    nameKey: 'profile.oceanTheme',
    descKey: 'profile.oceanThemeSubtitle',
    icon: Waves,
  },
];

export function ThemeModal({ visible, onClose }: ThemeModalProps) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const activeTheme = useBontonStore((s) => s.theme);
  const setTheme = useBontonStore((s) => s.setTheme);

  const handleSelectTheme = (id: ThemeName) => {
    haptics.select();
    setTheme(id);
  };

  const handleDone = () => {
    haptics.tap();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.dismissArea} onPress={onClose} />

        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconContainer}>
                <Palette size={22} color={theme.colors.primary} />
              </View>
              <View style={styles.headerTextGroup}>
                <Text variant="heading" style={styles.headerTitle}>
                  {t('profile.themeModalTitle')}
                </Text>
                <Text variant="caption" tone="secondary">
                  {t('profile.themeModalSubtitle')}
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

          {/* Theme list */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          >
            {THEME_OPTIONS.map((item) => {
              const isSelected = activeTheme === item.id;
              const Icon = item.icon;

              return (
                <Pressable
                  key={item.id}
                  onPress={() => handleSelectTheme(item.id)}
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
                        {t(item.nameKey)}
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
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create((theme) => ({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  sheet: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
    paddingBottom: Math.max(theme.spacing.xxl, 28),
    maxHeight: '85%',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: theme.isDark ? 0.35 : 0.15,
    shadowRadius: 18,
    elevation: 20,
  },
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
