import { Check, ChevronRight } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useTranslation } from 'react-i18next';

import { haptics } from '@/shared/lib/haptics';
import { CURRENCIES } from '@/shared/lib/money';
import { useBontonStore } from '@/shared/store/bonton-store';
import { Text } from '@/shared/ui';

interface ProfilePreferencesCardProps {
  onOpenCurrencyModal?: () => void;
  onOpenSplitModal?: () => void;
}

export function ProfilePreferencesCard({
  onOpenCurrencyModal,
  onOpenSplitModal,
}: ProfilePreferencesCardProps) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const currency = useBontonStore((s) => s.currency);
  const defaultSplitType = useBontonStore((s) => s.defaultSplitType);

  const currencySymbol = `${CURRENCIES[currency].symbol} (${currency})`;

  const splitLabel = (() => {
    switch (defaultSplitType) {
      case 'equal':
        return t('profile.splitEqualTitle', 'সমান ভাগ');
      case 'percentage':
        return t('profile.splitPercentageTitle', 'শতাংশ অনুযায়ী');
      case 'custom':
        return t('profile.splitCustomTitle', 'কাস্টম');
      default:
        return t('profile.splitEqualTitle', 'সমান ভাগ');
    }
  })();

  const handlePressSplit = () => {
    if (onOpenSplitModal) {
      haptics.tap();
      onOpenSplitModal();
    }
  };

  const handlePressCurrency = () => {
    if (onOpenCurrencyModal) {
      haptics.tap();
      onOpenCurrencyModal();
    }
  };

  return (
    <View style={styles.section}>
      <Text variant="heading" style={styles.sectionTitle}>
        {t('profile.preferences')}
      </Text>

      <View style={styles.card}>
        {/* Row 1: Split Mode (Pressable to configure central default split rule) */}
        <Pressable
          onPress={handlePressSplit}
          style={({ pressed }) => [
            styles.row,
            pressed && styles.rowPressed,
          ]}
        >
          <Text variant="body" style={styles.rowLabel}>
            {t('profile.splitMode')}
          </Text>

          <View style={styles.rowRight}>
            <View style={styles.badge}>
              <Check size={12} color={theme.colors.success} strokeWidth={2.6} />
              <Text variant="caption" style={styles.badgeText}>
                {splitLabel}
              </Text>
            </View>
            {onOpenSplitModal && (
              <ChevronRight size={18} color={theme.colors.textSecondary} />
            )}
          </View>
        </Pressable>

        <View style={styles.divider} />

        {/* Row 2: Currency Symbol (Pressable to select currency) */}
        <Pressable
          onPress={handlePressCurrency}
          style={({ pressed }) => [
            styles.row,
            pressed && styles.rowPressed,
          ]}
        >
          <Text variant="body" style={styles.rowLabel}>
            {t('profile.currency')}
          </Text>

          <View style={styles.rowRight}>
            <Text variant="label" tone="secondary">
              {currencySymbol}
            </Text>
            {onOpenCurrencyModal && (
              <ChevronRight size={18} color={theme.colors.textSecondary} />
            )}
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  section: {
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: theme.typography.weight.bold,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 4,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: theme.isDark ? 0.25 : 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowPressed: {
    opacity: 0.75,
    backgroundColor: theme.colors.background,
  },
  rowLabel: {
    fontWeight: theme.typography.weight.medium,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.successMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    color: theme.colors.success,
    fontWeight: theme.typography.weight.semibold,
    fontSize: 12,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: 16,
  },
}));
