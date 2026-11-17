import { Receipt } from 'lucide-react-native';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { useFormatters } from '@/shared/hooks/use-formatters';
import type { Expense, Group } from '@/shared/types/bonton';
import { Card, EmptyState, Text } from '@/shared/ui';

export interface ExpenseListProps {
  group: Group;
  onOpen: (expense: Expense) => void;
  onAdd: () => void;
}

export function ExpenseList({ group, onOpen, onAdd }: ExpenseListProps) {
  const { t } = useTranslation();
  const fmt = useFormatters();

  if (group.expenses.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title={t('group.noExpensesTitle')}
        body={t('group.noExpensesBody')}
        actionLabel={t('group.addExpense')}
        onAction={onAdd}
      />
    );
  }

  const membersById = new Map(group.members.map((m) => [m.id, m]));

  return (
    <View style={styles.list}>
      {group.expenses.map((expense, index) => {
        const payerNames = expense.payers
          .map((p) => membersById.get(p.memberId))
          .flatMap((m) => (m ? [fmt.memberName(m)] : []))
          .join(', ');

        return (
          <Animated.View key={expense.id} entering={FadeInDown.duration(260).delay(Math.min(index, 6) * 40)}>
            <ExpenseRow
              title={expense.title}
              subtitle={`${t('group.paidBy', { names: payerNames })} · ${fmt.date(expense.createdAt)}`}
              amount={fmt.money(expense.amount)}
              onPress={() => onOpen(expense)}
            />
          </Animated.View>
        );
      })}
    </View>
  );
}

interface ExpenseRowProps {
  title: string;
  subtitle: string;
  amount: string;
  onPress: () => void;
}

function ExpenseRow({ title, subtitle, amount, onPress }: ExpenseRowProps) {
  const { theme } = useUnistyles();
  return (
    <Card onPress={onPress} accessibilityLabel={`${title}, ${amount}`} style={styles.row}>
      <View style={styles.well}>
        <Receipt size={20} color={theme.colors.primaryText} strokeWidth={2} />
      </View>
      <View style={styles.body}>
        <Text variant="label" numberOfLines={1}>
          {title}
        </Text>
        <Text variant="caption" tone="secondary" numberOfLines={2}>
          {subtitle}
        </Text>
      </View>
      <Text variant="heading" numberOfLines={1}>
        {amount}
      </Text>
    </Card>
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
  well: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryMuted,
  },
  body: {
    flex: 1,
    gap: 2,
  },
}));
