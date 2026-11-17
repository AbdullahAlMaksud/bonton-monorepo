import { ArrowDownLeft, ArrowUpRight, CheckCircle2, Plus, Sparkles, TrendingDown, TrendingUp, Wallet } from 'lucide-react-native';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { useFormatters } from '@/shared/hooks/use-formatters';
import type { Cents } from '@/shared/types/bonton';
import { Button, Text } from '@/shared/ui';

export interface BalanceHeroProps {
  totalOwedToMe: Cents;
  totalIOwe: Cents;
  netBalance: Cents;
  onNewGroup: () => void;
  groupCount: number;
}

export function BalanceHero({
  totalOwedToMe,
  totalIOwe,
  netBalance,
  onNewGroup,
  groupCount,
}: BalanceHeroProps) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const fmt = useFormatters();

  const isPositive = netBalance > 0;
  const isNegative = netBalance < 0;

  const netTone = isPositive ? 'success' : isNegative ? 'danger' : 'secondary';

  return (
    <View style={styles.container}>
      {/* Top Brand & Greeting Header (sits on the gray wave) */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <View style={styles.brandBadge}>
            <Wallet size={20} color="#FFFFFF" strokeWidth={2.4} />
          </View>
          <View>
            <Text variant="title" style={styles.brandTitle}>
              {t('common.appName')}
            </Text>
            <Text variant="caption" style={styles.brandSubtitle}>
              {t('dashboard.subtitle')}
            </Text>
          </View>
        </View>
      </View>

      {/* Main "দেনা পাওনার হিসেব" (Debts & Receivables) Hero Card */}
      <Animated.View entering={FadeInDown.duration(350).springify()} style={styles.heroCard}>
        {/* Net Balance Highlight Section */}
        <View style={styles.netHeader}>
          <View style={styles.netLabelRow}>
            <View style={styles.iconCircle}>
              <Sparkles size={16} color={theme.colors.primary} />
            </View>
            <Text variant="label" tone="secondary" style={styles.netLabelText}>
              {t('dashboard.balanceOverview')}
            </Text>
          </View>

          {/* Status Badge */}
          <View
            style={[
              styles.statusPill,
              isPositive
                ? styles.statusPositive
                : isNegative
                  ? styles.statusNegative
                  : styles.statusNeutral,
            ]}
          >
            {isPositive ? (
              <TrendingUp size={14} color={theme.colors.success} strokeWidth={2.5} />
            ) : isNegative ? (
              <TrendingDown size={14} color={theme.colors.danger} strokeWidth={2.5} />
            ) : (
              <CheckCircle2 size={14} color={theme.colors.textSecondary} strokeWidth={2.5} />
            )}
            <Text
              variant="caption"
              tone={netTone}
              style={styles.statusText}
            >
              {isPositive
                ? t('dashboard.youAreOwed')
                : isNegative
                  ? t('dashboard.youOwe')
                  : t('dashboard.allSettledUp')}
            </Text>
          </View>
        </View>

        {/* Large Net Amount */}
        <View style={styles.amountContainer}>
          <Text
            variant="display"
            tone={netTone}
            style={styles.amountText}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {isPositive ? '+' : isNegative ? '-' : ''}
            {fmt.money(Math.abs(netBalance))}
          </Text>
          <Text variant="caption" tone="secondary">
            {t('dashboard.netBalance')}
          </Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* 2-Column Breakdown: আপনি পাবেন vs আপনি দেবেন */}
        <View style={styles.breakdownRow}>
          {/* আপনি পাবেন (You are owed) */}
          <View style={[styles.breakdownCol, styles.owedBox]}>
            <View style={styles.breakdownHeader}>
              <View style={[styles.miniIconBadge, styles.owedIconBadge]}>
                <ArrowDownLeft size={16} color={theme.colors.success} strokeWidth={2.5} />
              </View>
              <Text variant="label" tone="secondary">
                {t('dashboard.youAreOwed')}
              </Text>
            </View>
            <Text
              variant="heading"
              tone="success"
              style={styles.breakdownAmount}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {fmt.money(totalOwedToMe)}
            </Text>
          </View>

          {/* Vertical Separator */}
          <View style={styles.colSeparator} />

          {/* আপনি দেবেন (You owe) */}
          <View style={[styles.breakdownCol, styles.oweBox]}>
            <View style={styles.breakdownHeader}>
              <View style={[styles.miniIconBadge, styles.oweIconBadge]}>
                <ArrowUpRight size={16} color={theme.colors.danger} strokeWidth={2.5} />
              </View>
              <Text variant="label" tone="secondary">
                {t('dashboard.youOwe')}
              </Text>
            </View>
            <Text
              variant="heading"
              tone="danger"
              style={styles.breakdownAmount}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {fmt.money(totalIOwe)}
            </Text>
          </View>
        </View>

        {/* Quick CTA inside card if no groups yet */}
        {groupCount === 0 && (
          <View style={styles.cardCtaContainer}>
            <Button
              kind="primary"
              icon={Plus}
              label={t('dashboard.newGroup')}
              onPress={onNewGroup}
              fullWidth
            />
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  topBar: {
    paddingHorizontal: theme.spacing.xs,
    paddingTop: theme.spacing.xs,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  brandBadge: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  brandTitle: {
    color: '#FFFFFF',
    fontWeight: theme.typography.weight.bold,
  },
  brandSubtitle: {
    color: '#D4D4D8',
    opacity: 0.9,
  },
  heroCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: theme.isDark ? 0.35 : 0.08,
    shadowRadius: 12,
    elevation: 4,
    gap: theme.spacing.md,
  },
  netHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  netLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  netLabelText: {
    fontWeight: theme.typography.weight.semibold,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
  },
  statusPositive: {
    backgroundColor: theme.colors.successMuted,
    borderColor: theme.colors.success,
  },
  statusNegative: {
    backgroundColor: theme.colors.dangerMuted,
    borderColor: theme.colors.danger,
  },
  statusNeutral: {
    backgroundColor: theme.colors.secondaryMuted,
    borderColor: theme.colors.border,
  },
  statusText: {
    fontWeight: theme.typography.weight.medium,
  },
  amountContainer: {
    gap: 2,
    paddingVertical: theme.spacing.xs,
  },
  amountText: {
    fontWeight: theme.typography.weight.bold,
    letterSpacing: -0.5,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.border,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.isDark ? '#00000040' : '#00000005',
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  breakdownCol: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  colSeparator: {
    width: StyleSheet.hairlineWidth,
    height: '80%',
    backgroundColor: theme.colors.border,
  },
  owedBox: {},
  oweBox: {},
  breakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  miniIconBadge: {
    width: 24,
    height: 24,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  owedIconBadge: {
    backgroundColor: theme.colors.successMuted,
  },
  oweIconBadge: {
    backgroundColor: theme.colors.dangerMuted,
  },
  breakdownAmount: {
    fontWeight: theme.typography.weight.bold,
  },
  cardCtaContainer: {
    paddingTop: theme.spacing.xs,
  },
}));
