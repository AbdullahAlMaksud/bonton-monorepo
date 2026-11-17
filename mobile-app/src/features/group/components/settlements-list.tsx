import { ArrowRight, CircleCheck } from 'lucide-react-native';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { useFormatters } from '@/shared/hooks/use-formatters';
import type { Group, Transfer } from '@/shared/types/bonton';
import { Avatar, Card, EmptyState, Text } from '@/shared/ui';

export interface SettlementsListProps {
  group: Group;
  transfers: Transfer[];
}

/** Who owes whom, reduced to the fewest possible payments. */
export function SettlementsList({ group, transfers }: SettlementsListProps) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const fmt = useFormatters();

  if (transfers.length === 0) {
    return <EmptyState icon={CircleCheck} title={t('group.allSettledTitle')} body={t('group.allSettledBody')} />;
  }

  const membersById = new Map(group.members.map((m) => [m.id, m]));

  return (
    <View style={styles.list}>
      {transfers.map((transfer, index) => {
        const from = membersById.get(transfer.from);
        const to = membersById.get(transfer.to);
        if (!from || !to) return null;

        const fromName = fmt.memberName(from);
        const toName = fmt.memberName(to);
        const line = t('group.settlementLine', { from: fromName, to: toName });
        // Highlight what matters to the current user: money going out vs coming in.
        const tone = from.isMe ? 'danger' : to.isMe ? 'success' : 'primary';

        return (
          <Animated.View
            key={`${transfer.from}-${transfer.to}`}
            entering={FadeInDown.duration(260).delay(Math.min(index, 6) * 50)}
          >
            <Card accessibilityLabel={`${line} ${fmt.money(transfer.amount)}`} style={styles.row}>
              <View style={styles.people}>
                <Avatar name={fromName} highlight={from.isMe} size={36} />
                <ArrowRight size={18} color={theme.colors.textSecondary} />
                <Avatar name={toName} highlight={to.isMe} size={36} />
              </View>
              <View style={styles.body}>
                <Text variant="label" numberOfLines={2}>
                  {line}
                </Text>
              </View>
              <Text variant="heading" tone={tone} numberOfLines={1}>
                {fmt.money(transfer.amount)}
              </Text>
            </Card>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  list: {
    gap: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  people: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  body: {
    flex: 1,
  },
}));
