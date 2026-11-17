import { Pencil, Plus, Trash2, Users } from 'lucide-react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { BalancesList } from '@/features/group/components/balances-list';
import { ExpenseList } from '@/features/group/components/expense-list';
import { GroupSummary } from '@/features/group/components/group-summary';
import { SettlementsList } from '@/features/group/components/settlements-list';
import { useFormatters } from '@/shared/hooks/use-formatters';
import { findMe } from '@/shared/lib/group-math';
import { haptics } from '@/shared/lib/haptics';
import { useBontonStore } from '@/shared/store/bonton-store';
import { useGroup, useGroupBalances, useGroupSettlements, useGroupTotal } from '@/shared/store/selectors';
import type { Member } from '@/shared/types/bonton';
import { Button, EmptyState, Fab, IconButton, Screen, SegmentedControl, type SegmentOption } from '@/shared/ui';

type GroupTab = 'expenses' | 'balances' | 'settlements';

export default function GroupDetailScreen() {
  const { t } = useTranslation();
  const { rt } = useUnistyles();
  const fmt = useFormatters();
  const { id } = useLocalSearchParams<{ id: string }>();

  const group = useGroup(id);
  const balances = useGroupBalances(group);
  const transfers = useGroupSettlements(group);
  const total = useGroupTotal(group);
  const addMember = useBontonStore((s) => s.addMember);
  const removeMember = useBontonStore((s) => s.removeMember);
  const deleteGroup = useBontonStore((s) => s.deleteGroup);

  const [tab, setTab] = useState<GroupTab>('expenses');

  if (!group) {
    return (
      <Screen>
        <Stack.Screen options={{ title: '' }} />
        <EmptyState
          icon={Users}
          title={t('errors.notFoundTitle')}
          body=""
          actionLabel={t('errors.goHome')}
          onAction={() => router.replace('/')}
        />
      </Screen>
    );
  }

  const tabOptions: ReadonlyArray<SegmentOption<GroupTab>> = [
    { value: 'expenses', label: t('group.tabs.expenses') },
    { value: 'balances', label: t('group.tabs.balances') },
    { value: 'settlements', label: t('group.tabs.settlements') },
  ];

  const me = findMe(group);
  const myBalance = me ? (balances.find((b) => b.memberId === me.id)?.balance ?? 0) : 0;

  const openAddExpense = () =>
    router.push({ pathname: '/expense/add', params: { groupId: group.id } });

  const confirmRemove = (member: Member) => {
    if (group.members.length <= 2) {
      haptics.warning();
      Alert.alert(t('group.minMembersToRemove'));
      return;
    }
    const balance = balances.find((b) => b.memberId === member.id)?.balance ?? 0;
    haptics.warning();
    Alert.alert(
      t('group.removeMemberTitle', { name: member.name }),
      `${t('group.removeMemberBody')}\n\n${t('group.removeMemberBalance', { amount: fmt.money(balance) })}`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.remove'),
          style: 'destructive',
          onPress: () => {
            const result = removeMember(group.id, member.id);
            if (result.ok) haptics.success();
            else if (result.reason === 'min_members') Alert.alert(t('group.minMembersToRemove'));
          },
        },
      ],
    );
  };

  const confirmDeleteGroup = () => {
    haptics.warning();
    Alert.alert(t('group.deleteGroupTitle'), t('group.deleteGroupBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          // Leave the screen first so it never renders a deleted group.
          router.replace('/');
          deleteGroup(group.id);
        },
      },
    ]);
  };

  const handleAddMember = (name: string): string | null => {
    const result = addMember(group.id, name);
    if (result.ok) return null;
    return result.reason === 'duplicate' ? t('group.duplicateMember') : t('groupNew.errors.nameRequired');
  };

  return (
    <View style={styles.root}>
      <Stack.Screen
        options={{
          title: group.name,
          headerRight: () => (
            <IconButton
              icon={Pencil}
              label={t('common.edit')}
              onPress={() => router.push({ pathname: '/groups/new', params: { groupId: group.id } })}
            />
          ),
        }}
      />
      <Screen contentStyle={styles.content}>
        <GroupSummary icon={group.icon} name={group.name} totalSpent={total} myBalance={myBalance} />

        <SegmentedControl options={tabOptions} value={tab} onChange={setTab} />

        {tab === 'expenses' ? (
          <ExpenseList
            group={group}
            onAdd={openAddExpense}
            onOpen={(expense) =>
              router.push({ pathname: '/expense/add', params: { groupId: group.id, expenseId: expense.id } })
            }
          />
        ) : null}

        {tab === 'balances' ? (
          <>
            <BalancesList
              group={group}
              balances={balances}
              onRemoveMember={confirmRemove}
              onAddMember={handleAddMember}
            />
            <Button kind="danger" icon={Trash2} label={t('group.deleteGroup')} onPress={confirmDeleteGroup} />
          </>
        ) : null}

        {tab === 'settlements' ? <SettlementsList group={group} transfers={transfers} /> : null}
      </Screen>
      <Fab icon={Plus} label={t('group.addExpense')} onPress={openAddExpense} bottomOffset={rt.insets.bottom} />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  // Extra room so the floating action button never covers the last row.
  content: {
    paddingBottom: 110,
  },
}));
