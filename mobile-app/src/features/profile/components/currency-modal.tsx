import { Coins, X } from 'lucide-react-native';
import { Pressable, ScrollView, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useTranslation } from 'react-i18next';

import { haptics } from '@/shared/lib/haptics';
import { CURRENCIES } from '@/shared/lib/money';
import { useBontonStore } from '@/shared/store/bonton-store';
import { CURRENCY_CODES, type CurrencyCode } from '@/shared/types/bonton';
import { BottomSheetModal, Button, Text } from '@/shared/ui';

interface CurrencyModalProps {
  visible: boolean;
  onClose: () => void;
}

export function CurrencyModal({ visible, onClose }: CurrencyModalProps) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const activeCurrency = useBontonStore((s) => s.currency);
  const setCurrency = useBontonStore((s) => s.setCurrency);

  const handleSelectCurrency = (code: CurrencyCode) => {
    haptics.select();
    setCurrency(code);
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
                <Coins size={22} color={theme.colors.primary} />
              </View>
              <View style={styles.headerTextGroup}>
                <Text variant="heading" style={styles.headerTitle}>
                  {t('settings.currency')}
                </Text>
                <Text variant="caption" tone="secondary">
                  {t('settings.currencyHint')}
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

          {/* Currency list */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          >
            {CURRENCY_CODES.map((code) => {
              const isSelected = activeCurrency === code;
              const currencyInfo = CURRENCIES[code];
              const name = t(`settings.currencies.${code}` as const);

              return (
                <Pressable
                  key={code}
                  onPress={() => handleSelectCurrency(code)}
                  style={({ pressed }) => [
                    styles.optionItem,
                    isSelected && styles.optionItemSelected,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <View style={styles.optionLeft}>
                    <View
                      style={[
                        styles.symbolContainer,
                        isSelected && styles.symbolContainerSelected,
                      ]}
                    >
                      <Text variant="heading" style={styles.symbolText}>
                        {currencyInfo.symbol}
                      </Text>
                    </View>

                    <View style={styles.optionTextGroup}>
                      <Text
                        variant="body"
                        style={[
                          styles.optionTitle,
                          isSelected && styles.optionTitleSelected,
                        ]}
                      >
                        {name}
                      </Text>
                      <Text variant="caption" tone="secondary">
                        {code} • {currencyInfo.symbol}
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
  symbolContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbolContainerSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.background,
  },
  symbolText: {
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.primary,
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
