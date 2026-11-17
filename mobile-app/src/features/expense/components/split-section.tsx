import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native-unistyles';

import { useFormatters } from '@/shared/hooks/use-formatters';
import { BPS_TOTAL } from '@/shared/lib/settlement';
import type { Member, SplitType } from '@/shared/types/bonton';
import { Chip, SegmentedControl, Text, type SegmentOption } from '@/shared/ui';

import { AmountDiff } from './amount-diff';
import { FormSection } from './form-section';
import { MemberAmountRow } from './member-amount-row';
import {
  setMemberText,
  switchSplitType,
  toggleParticipant,
  type ExpenseFormState,
  type FormAnalysis,
} from '../expense-form';

export interface SplitSectionProps {
  form: ExpenseFormState;
  members: readonly Member[];
  analysis: FormAnalysis;
  onChange: (updater: (form: ExpenseFormState) => ExpenseFormState) => void;
}

export function SplitSection({ form, members, analysis, onChange }: SplitSectionProps) {
  const { t } = useTranslation();
  const fmt = useFormatters();

  const options: ReadonlyArray<SegmentOption<SplitType>> = [
    { value: 'equal', label: t('expense.splitEqual') },
    { value: 'percentage', label: t('expense.splitPercentage') },
    { value: 'custom', label: t('expense.splitCustom') },
  ];

  return (
    <FormSection title={t('expense.splitLabel')}>
      <SegmentedControl
        options={options}
        value={form.splitType}
        onChange={(next) => onChange((f) => switchSplitType(f, members, next))}
      />

      {form.splitType === 'equal' ? (
        <View style={styles.block}>
          <Text variant="label" tone="secondary">
            {t('expense.splitBetween')}
          </Text>
          <View style={styles.chips}>
            {members.map((member) => (
              <Chip
                key={member.id}
                label={fmt.memberName(member)}
                selected={Boolean(form.participants[member.id])}
                onPress={() => onChange((f) => toggleParticipant(f, member.id))}
              />
            ))}
          </View>
        </View>
      ) : null}

      {form.splitType === 'percentage' ? (
        <View style={styles.block}>
          {members.map((member) => (
            <MemberAmountRow
              key={member.id}
              kind="percent"
              member={member}
              value={form.percentages[member.id] ?? ''}
              onChangeText={(text) => onChange((f) => setMemberText(f, 'percentages', member.id, text))}
            />
          ))}
          <Text variant="label" tone={analysis.percentTotalBps === BPS_TOTAL ? 'success' : 'warning'}>
            {t('expense.percentTotal', { value: fmt.bps(analysis.percentTotalBps) })}
          </Text>
          {analysis.percentTotalBps > 0 && analysis.percentTotalBps !== BPS_TOTAL ? (
            <Text variant="caption" tone="secondary">
              {t('expense.percentNormalized')}
            </Text>
          ) : null}
        </View>
      ) : null}

      {form.splitType === 'custom' ? (
        <View style={styles.block}>
          {members.map((member) => (
            <MemberAmountRow
              key={member.id}
              kind="money"
              member={member}
              value={form.customAmounts[member.id] ?? ''}
              onChangeText={(text) => onChange((f) => setMemberText(f, 'customAmounts', member.id, text))}
            />
          ))}
          {analysis.shared > 0 ? <AmountDiff diff={analysis.shared - analysis.customTotal} /> : null}
        </View>
      ) : null}
    </FormSection>
  );
}

const styles = StyleSheet.create((theme) => ({
  block: {
    gap: theme.spacing.md,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
}));
