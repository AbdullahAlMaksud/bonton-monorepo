import { Receipt } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ExpenseFormView } from '@/features/expense/components/expense-form-view';
import { useActiveGroup, useGroup } from '@/shared/store/selectors';
import { useBontonStore } from '@/shared/store/bonton-store';
import { EmptyState, Screen } from '@/shared/ui';

/**
 * Add an expense to `?groupId=`, or edit one with `?expenseId=` as well.
 * Falls back to the current active group if groupId is omitted.
 */
export default function ExpenseAddScreen() {
  const { t } = useTranslation();
  const { groupId: rawGroupId, expenseId } = useLocalSearchParams<{ groupId?: string; expenseId?: string }>();
  const activeGroup = useActiveGroup();
  const fallbackGroup = useBontonStore((s) => s.groups[0]);
  const queriedGroup = useGroup(rawGroupId);
  const group = queriedGroup ?? activeGroup ?? fallbackGroup;

  if (!group) {
    return (
      <Screen>
        <EmptyState
          icon={Receipt}
          title={t('expense.noGroup')}
          body=""
          actionLabel={t('dashboard.newGroup')}
          onAction={() => router.replace('/groups/new')}
        />
      </Screen>
    );
  }

  const expense = expenseId ? group.expenses.find((e) => e.id === expenseId) : undefined;
  return <ExpenseFormView key={expense?.id ?? 'new'} group={group} expense={expense} />;
}
