import { Trash2 } from 'lucide-react-native';
import { router, Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useFormatters } from '@/shared/hooks/use-formatters';
import { haptics } from '@/shared/lib/haptics';
import type { SplitIssue } from '@/shared/lib/settlement';
import { useBontonStore, type ExpenseError } from '@/shared/store/bonton-store';
import type { Expense, Group } from '@/shared/types/bonton';
import { Button, MoneyInput, Screen, Text, TextField } from '@/shared/ui';

import { analyzeForm, createInitialForm, type ExpenseFormState } from '../expense-form';
import { PayerSection } from './payer-section';
import { PersonalBillsSection } from './personal-bills-section';
import { PreviewSection } from './preview-section';
import { SplitSection } from './split-section';

export interface ExpenseFormViewProps {
  group: Group;
  /** Present when editing an existing expense. */
  expense?: Expense;
}

export function ExpenseFormView({ group, expense }: ExpenseFormViewProps) {
  const { t } = useTranslation();
  const fmt = useFormatters();
  const addExpense = useBontonStore((s) => s.addExpense);
  const updateExpense = useBontonStore((s) => s.updateExpense);
  const deleteExpense = useBontonStore((s) => s.deleteExpense);

  const isEditing = expense !== undefined;
  const members = group.members;

  const [form, setForm] = useState<ExpenseFormState>(() => createInitialForm(members, expense));
  const [submitted, setSubmitted] = useState(false);
  const analysis = useMemo(() => analyzeForm(form, members), [form, members]);

  const titleError = submitted && form.title.trim() === '' ? t('expense.titleRequired') : null;

  const issue: SplitIssue | null = analysis.result.ok ? null : analysis.result.issue;
  // Before the first save attempt, stay quiet until an amount exists, then guide live.
  const showIssue = issue !== null && (submitted || analysis.amount > 0);

  const issueDiff = issue
    ? issue.code === 'payers_mismatch' || issue.code === 'custom_mismatch' || issue.code === 'personal_exceeds_total'
      ? issue.diff
      : 0
    : 0;

  const describeStoreError = (error: ExpenseError): string => {
    switch (error.kind) {
      case 'title_required':
        return t('expense.titleRequired');
      case 'split':
        return t(`expense.errors.${error.issue.code}`);
      case 'not_found':
      case 'unknown_member':
        return t('expense.noGroup');
    }
  };

  const save = () => {
    setSubmitted(true);
    if (form.title.trim() === '' || !analysis.result.ok) {
      haptics.error();
      return;
    }

    const outcome = isEditing
      ? updateExpense(group.id, expense.id, analysis.input)
      : addExpense(group.id, analysis.input);

    if (outcome.ok) {
      haptics.success();
      router.back();
    } else {
      haptics.error();
      Alert.alert(describeStoreError(outcome.error));
    }
  };

  const confirmDelete = () => {
    if (!expense) return;
    haptics.warning();
    Alert.alert(t('expense.deleteTitle'), t('expense.deleteBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          deleteExpense(group.id, expense.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <>
      <Stack.Screen options={{ title: isEditing ? t('expense.editTitle') : t('expense.addTitle') }} />
      <Screen
        footer={
          <>
            <Button fullWidth label={t('expense.save')} onPress={save} />
            {isEditing ? (
              <Button fullWidth kind="danger" icon={Trash2} label={t('expense.delete')} onPress={confirmDelete} />
            ) : null}
          </>
        }
      >
        <TextField
          label={t('expense.titleLabel')}
          placeholder={t('expense.titlePlaceholder')}
          value={form.title}
          onChangeText={(title) => setForm((f) => ({ ...f, title }))}
          error={titleError}
          maxLength={60}
          returnKeyType="next"
        />

        <MoneyInput
          label={t('expense.amountLabel')}
          value={form.amount}
          onChangeText={(amount) => setForm((f) => ({ ...f, amount }))}
        />

        <PayerSection form={form} members={members} analysis={analysis} onChange={setForm} />
        <PersonalBillsSection form={form} members={members} analysis={analysis} onChange={setForm} />
        <SplitSection form={form} members={members} analysis={analysis} onChange={setForm} />

        {showIssue && issue ? (
          <Text tone="danger" accessibilityLiveRegion="polite">
            {t(`expense.errors.${issue.code}`)}
            {issueDiff !== 0
              ? ` ${issueDiff > 0 ? t('expense.unassigned', { amount: fmt.money(issueDiff) }) : t('expense.overBy', { amount: fmt.money(-issueDiff) })}`
              : ''}
          </Text>
        ) : null}

        <PreviewSection members={members} analysis={analysis} />
      </Screen>
    </>
  );
}
