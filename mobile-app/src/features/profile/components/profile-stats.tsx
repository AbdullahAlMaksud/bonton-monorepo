import { CreditCard, FolderKanban, Receipt, TrendingDown, TrendingUp } from 'lucide-react-native';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { useFormatters } from '@/shared/hooks/use-formatters';
import type { Cents } from '@/shared/types/bonton';
import { Text } from '@/shared/ui';

export interface ProfileStatsProps {
  groupCount: number;
  expenseCount: number;
  totalPaidByMe: Cents;
  netBalance: Cents;
}

export function ProfileStats({
  groupCount,
  expenseCount,
  totalPaidByMe,
  netBalance,
}: ProfileStatsProps) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const fmt = useFormatters();

  const isPositive = netBalance > 0;
  const isNegative = netBalance < 0;
  const netTone = isPositive ? 'success' : isNegative ? 'danger' : 'secondary';

  return (
    <View style={styles.container}>
      <Text variant="heading" style={styles.sectionTitle}>
        {t('profile.financialSummary')}
      </Text>

      {/* 2x2 Grid of Stats Cards */}
      <View style={styles.grid}>
        {/* 1. Active Groups */}
        <Animated.View entering={FadeInDown.duration(300).delay(50)} style={styles.card}>
          <View style={[styles.iconWell, { backgroundColor: theme.colors.primaryMuted }]}>
            <FolderKanban size={18} color={theme.colors.primaryText} strokeWidth={2.4} />
          </View>
          <Text variant="caption" tone="secondary">
            {t('profile.totalGroups')}
          </Text>
          <Text variant="title" style={styles.statValue}>
            {fmt.count(groupCount)}
          </Text>
        </Animated.View>

        {/* 2. Total Expenses */}
        <Animated.View entering={FadeInDown.duration(300).delay(100)} style={styles.card}>
          <View style={[styles.iconWell, { backgroundColor: theme.colors.secondaryMuted }]}>
            <Receipt size={18} color={theme.colors.secondaryText} strokeWidth={2.4} />
          </View>
          <Text variant="caption" tone="secondary">
            {t('profile.totalExpenses')}
          </Text>
          <Text variant="title" style={styles.statValue}>
            {fmt.count(expenseCount)}
          </Text>
        </Animated.View>

        {/* 3. Total Paid By Me */}
        <Animated.View entering={FadeInDown.duration(300).delay(150)} style={styles.card}>
          <View style={[styles.iconWell, { backgroundColor: theme.colors.primaryMuted }]}>
            <CreditCard size={18} color={theme.colors.primaryText} strokeWidth={2.4} />
          </View>
          <Text variant="caption" tone="secondary">
            {t('profile.totalPaidByMe')}
          </Text>
          <Text
            variant="title"
            style={styles.statValue}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {fmt.money(totalPaidByMe)}
          </Text>
        </Animated.View>

        {/* 4. Net Position */}
        <Animated.View entering={FadeInDown.duration(300).delay(200)} style={styles.card}>
          <View
            style={[
              styles.iconWell,
              {
                backgroundColor: isPositive
                  ? theme.colors.successMuted
                  : isNegative
                    ? theme.colors.dangerMuted
                    : theme.colors.secondaryMuted,
              },
            ]}
          >
            {isPositive ? (
              <TrendingUp size={18} color={theme.colors.success} strokeWidth={2.4} />
            ) : isNegative ? (
              <TrendingDown size={18} color={theme.colors.danger} strokeWidth={2.4} />
            ) : (
              <Receipt size={18} color={theme.colors.textSecondary} strokeWidth={2.4} />
            )}
          </View>
          <Text variant="caption" tone="secondary">
            {t('profile.netStatus')}
          </Text>
          <Text
            variant="title"
            tone={netTone}
            style={styles.statValue}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {isPositive ? '+' : isNegative ? '-' : ''}
            {fmt.money(Math.abs(netBalance))}
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    gap: theme.spacing.md,
  },
  sectionTitle: {
    fontWeight: theme.typography.weight.bold,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  card: {
    flexGrow: 1,
    flexBasis: '46%',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.xs,
  },
  iconWell: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xs,
  },
  statValue: {
    fontWeight: theme.typography.weight.bold,
  },
}));
