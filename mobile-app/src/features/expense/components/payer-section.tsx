import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native-unistyles';

import { useFormatters } from '@/shared/hooks/use-formatters';
import type { Member } from '@/shared/types/bonton';
import { Chip } from '@/shared/ui';

import { AmountDiff } from './amount-diff';
import { FormSection } from './form-section';
import { MemberAmountRow } from './member-amount-row';
import { ToggleRow } from './toggle-row';
import { setMemberText, type ExpenseFormState, type FormAnalysis } from '../expense-form';

export interface PayerSectionProps {
  form: ExpenseFormState;
  members: readonly Member[];
  analysis: FormAnalysis;
  onChange: (updater: (form: ExpenseFormState) => ExpenseFormState) => void;
}

export function PayerSection({ form, members, analysis, onChange }: PayerSectionProps) {
  const { t } = useTranslation();
  const fmt = useFormatters();

  return (
    <FormSection
      title={t('expense.paidByLabel')}
      hint={form.multiplePayers ? t('expense.payerAmountHint') : undefined}
    >
      {form.multiplePayers ? (
        <View style={styles.rows}>
          {members.map((member) => (
            <MemberAmountRow
              key={member.id}
              kind="money"
              member={member}
              value={form.payerAmounts[member.id] ?? ''}
              onChangeText={(text) => onChange((f) => setMemberText(f, 'payerAmounts', member.id, text))}
            />
          ))}
          {analysis.amount > 0 ? <AmountDiff diff={analysis.amount - analysis.payersTotal} /> : null}
        </View>
      ) : (
        <View style={styles.chips}>
          {members.map((member) => (
            <Chip
              key={member.id}
              label={fmt.memberName(member)}
              selected={member.id === form.payerId}
              onPress={() => onChange((f) => ({ ...f, payerId: member.id }))}
            />
          ))}
        </View>
      )}

      <ToggleRow
        label={t('expense.multiplePayers')}
        value={form.multiplePayers}
        onValueChange={(value) => onChange((f) => ({ ...f, multiplePayers: value }))}
      />
    </FormSection>
  );
}

const styles = StyleSheet.create((theme) => ({
  rows: {
    gap: theme.spacing.md,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
}));
