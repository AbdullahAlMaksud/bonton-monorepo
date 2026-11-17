import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native-unistyles';

import { useFormatters } from '@/shared/hooks/use-formatters';
import type { Member } from '@/shared/types/bonton';
import { Text } from '@/shared/ui';

import { FormSection } from './form-section';
import { MemberAmountRow } from './member-amount-row';
import { ToggleRow } from './toggle-row';
import { setMemberText, type ExpenseFormState, type FormAnalysis } from '../expense-form';

export interface PersonalBillsSectionProps {
  form: ExpenseFormState;
  members: readonly Member[];
  analysis: FormAnalysis;
  onChange: (updater: (form: ExpenseFormState) => ExpenseFormState) => void;
}

/** Amounts only one person should cover (e.g. their own drink). Deducted before the shared split. */
export function PersonalBillsSection({ form, members, analysis, onChange }: PersonalBillsSectionProps) {
  const { t } = useTranslation();
  const fmt = useFormatters();

  return (
    <FormSection title={t('expense.personalBills')} hint={t('expense.personalBillsHint')}>
      <ToggleRow
        label={t('expense.personalBills')}
        value={form.personalOpen}
        onValueChange={(value) => onChange((f) => ({ ...f, personalOpen: value }))}
      />
      {form.personalOpen ? (
        <View style={styles.rows}>
          {members.map((member) => (
            <MemberAmountRow
              key={member.id}
              kind="money"
              member={member}
              value={form.personalAmounts[member.id] ?? ''}
              onChangeText={(text) => onChange((f) => setMemberText(f, 'personalAmounts', member.id, text))}
            />
          ))}
          {analysis.amount > 0 ? (
            <Text variant="label" tone={analysis.shared < 0 ? 'danger' : 'secondary'}>
              {t('expense.sharedAmount', { amount: fmt.money(Math.max(analysis.shared, 0)) })}
            </Text>
          ) : null}
        </View>
      ) : null}
    </FormSection>
  );
}

const styles = StyleSheet.create((theme) => ({
  rows: {
    gap: theme.spacing.md,
  },
}));
