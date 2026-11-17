import { ArrowDownLeft, ArrowUpRight, Check, ChevronRight } from 'lucide-react-native';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { useFormatters } from '@/shared/hooks/use-formatters';
import type { Group, GroupSummary } from '@/shared/types/bonton';
import { Card, GroupIcon, Text } from '@/shared/ui';

export interface GroupCardProps {
  group: Group;
  summary: GroupSummary;
  index: number;
  onPress: () => void;
}

export function GroupCard({ group, summary, index, onPress }: GroupCardProps) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const fmt = useFormatters();
  const balance = summary.myBalance;

  const isOwed = balance > 0;
  const owes = balance < 0;

  const balanceText = isOwed
    ? t('dashboard.owedToYou', { amount: fmt.money(balance) })
    : owes
      ? t('dashboard.youOweAmount', { amount: fmt.money(-balance) })
      : t('dashboard.settledUp');

  const tone = isOwed ? 'success' : owes ? 'danger' : 'secondary';

  return (
    <Animated.View entering={FadeInDown.duration(280).delay(Math.min(index, 6) * 45)}>
      <Card
        onPress={onPress}
        accessibilityLabel={`${group.name}, ${balanceText}`}
        style={styles.card}
      >
        {/* Left: Group Icon */}
        <View style={styles.iconWrapper}>
          <GroupIcon name={group.icon} />
        </View>

        {/* Center: Info */}
        <View style={styles.body}>
          <Text variant="heading" numberOfLines={1} style={styles.groupName}>
            {group.name}
          </Text>
          <Text variant="caption" tone="secondary">
            {t('dashboard.membersCount', { count: fmt.count(group.members.length) })}
          </Text>
        </View>

        {/* Right: Balance Pill & Chevron */}
        <View style={styles.rightSection}>
          <View
            style={[
              styles.balanceBadge,
              isOwed
                ? styles.badgeOwed
                : owes
                  ? styles.badgeOwe
                  : styles.badgeSettled,
            ]}
          >
            {isOwed ? (
              <ArrowDownLeft size={13} color={theme.colors.success} strokeWidth={2.4} />
            ) : owes ? (
              <ArrowUpRight size={13} color={theme.colors.danger} strokeWidth={2.4} />
            ) : (
              <Check size={13} color={theme.colors.textSecondary} strokeWidth={2.4} />
            )}
            <Text variant="caption" tone={tone} style={styles.balanceText} numberOfLines={1}>
              {balanceText}
            </Text>
          </View>

          <ChevronRight size={18} color={theme.colors.textSecondary} />
        </View>
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: 3,
  },
  groupName: {
    fontWeight: theme.typography.weight.semibold,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  balanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
  },
  badgeOwed: {
    backgroundColor: theme.colors.successMuted,
    borderColor: theme.colors.success,
  },
  badgeOwe: {
    backgroundColor: theme.colors.dangerMuted,
    borderColor: theme.colors.danger,
  },
  badgeSettled: {
    backgroundColor: theme.colors.secondaryMuted,
    borderColor: theme.colors.border,
  },
  balanceText: {
    fontWeight: theme.typography.weight.medium,
  },
}));
