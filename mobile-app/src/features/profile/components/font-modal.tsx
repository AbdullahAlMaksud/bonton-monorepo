import { Type, X } from 'lucide-react-native';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useTranslation } from 'react-i18next';

import { haptics } from '@/shared/lib/haptics';
import { useBontonStore } from '@/shared/store/bonton-store';
import { FONT_OPTIONS, getFontFamily } from '@/shared/theme/fonts';
import type { FontName } from '@/shared/types/bonton';
import { Button, Text } from '@/shared/ui';

interface FontModalProps {
  visible: boolean;
  onClose: () => void;
}

export function FontModal({ visible, onClose }: FontModalProps) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const activeFont = useBontonStore((s) => s.font);
  const setFont = useBontonStore((s) => s.setFont);

  const handleSelectFont = (fontId: FontName) => {
    haptics.select();
    setFont(fontId);
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
                <Type size={22} color={theme.colors.primary} />
              </View>
              <View style={styles.headerTextGroup}>
                <Text variant="heading" style={styles.headerTitle}>
                  {t('profile.fontModalTitle')}
                </Text>
                <Text variant="caption" tone="secondary">
                  {t('profile.fontModalSubtitle')}
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

          {/* Font List */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          >
            {FONT_OPTIONS.map((item) => {
              const isSelected = activeFont === item.id;
              const previewFontFamily = getFontFamily(item.id, 'normal');

              return (
                <Pressable
                  key={item.id}
                  onPress={() => handleSelectFont(item.id)}
                  style={({ pressed }) => [
                    styles.optionItem,
                    isSelected && styles.optionItemSelected,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <View style={styles.optionContent}>
                    {/* Top Row: Font Name, Badge, Radio */}
                    <View style={styles.optionHeaderRow}>
                      <View style={styles.optionTitleRow}>
                        <Text
                          variant="body"
                          style={[
                            styles.optionTitle,
                            isSelected && styles.optionTitleSelected,
                            previewFontFamily ? { fontFamily: previewFontFamily } : null,
                          ]}
                        >
                          {item.nameBn}
                        </Text>
                        <View style={styles.langBadge}>
                          <Text variant="caption" style={styles.langBadgeText}>
                            {item.badge}
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
                    </View>

                    {/* Subtitle description */}
                    <Text variant="caption" tone="secondary" style={styles.optionSubtitle}>
                      {item.subtitle}
                    </Text>

                    {/* Live Preview Sample */}
                    <View
                      style={[
                        styles.previewCard,
                        isSelected && styles.previewCardSelected,
                      ]}
                    >
                      <Text
                        variant="caption"
                        style={[
                          styles.previewText,
                          previewFontFamily ? { fontFamily: previewFontFamily } : null,
                        ]}
                      >
                        "{item.preview}"
                      </Text>
                    </View>
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
    padding: 14,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  optionItemSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryMuted,
  },
  optionContent: {
    gap: 6,
  },
  optionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionTitle: {
    fontWeight: theme.typography.weight.medium,
    fontSize: 16,
  },
  optionTitleSelected: {
    fontWeight: theme.typography.weight.bold,
  },
  langBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  langBadgeText: {
    fontSize: 10,
    fontWeight: theme.typography.weight.semibold,
  },
  optionSubtitle: {
    fontSize: 12,
  },
  previewCard: {
    marginTop: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  previewCardSelected: {
    backgroundColor: theme.colors.background,
  },
  previewText: {
    fontSize: 13,
    color: theme.colors.text,
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
