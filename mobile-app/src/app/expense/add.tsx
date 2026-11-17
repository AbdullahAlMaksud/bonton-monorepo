import { Receipt } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ExpenseFormView } from '@/features/expense/components/expense-form-view';
import { useGroup } from '@/shared/store/selectors';
import { EmptyState, Screen } from '@/shared/ui';

/**
 * Add an expense to `?groupId=`, or edit one with `?expenseId=` as well.
 * The form lives in its own component so its state is initialized once the group is known.
 */
export default function ExpenseAddScreen() {
  const { t } = useTranslation();
  const { groupId, expenseId } = useLocalSearchParams<{ groupId: string; expenseId?: string }>();
  const group = useGroup(groupId);

  if (!group) {
    return (
      <Screen>
        <EmptyState
          icon={Receipt}
          title={t('expense.noGroup')}
          body=""
          actionLabel={t('errors.goHome')}
          onAction={() => router.replace('/')}
        />
      </Screen>
    );
  }

  const expense = expenseId ? group.expenses.find((e) => e.id === expenseId) : undefined;
  return <ExpenseFormView key={expense?.id ?? 'new'} group={group} expense={expense} />;
}
