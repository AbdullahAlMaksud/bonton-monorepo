import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native-unistyles';

import { useFormatters } from '@/shared/hooks/use-formatters';
import type { Member } from '@/shared/types/bonton';
import { Avatar, Card, Text } from '@/shared/ui';

import { FormSection } from './form-section';
import type { FormAnalysis } from '../expense-form';

export interface PreviewSectionProps {
  members: readonly Member[];
  analysis: FormAnalysis;
}

/** Live "who owes what" — exactly the numbers that will be saved. */
export function PreviewSection({ members, analysis }: PreviewSectionProps) {
  const { t } = useTranslation();
  const fmt = useFormatters();

  if (!analysis.result.ok) return null;
  const shares = analysis.result.value;
  const rows = members.flatMap((member) => {
    const share = shares[member.id] ?? 0;
    return share > 0 ? [{ member, share }] : [];
  });
  if (rows.length === 0) return null;

  return (
    <FormSection title={t('expense.preview')}>
      <Card style={styles.card}>
        {rows.map(({ member, share }) => {
          const name = fmt.memberName(member);
          return (
            <View key={member.id} style={styles.row}>
              <Avatar name={name} highlight={member.isMe} size={32} />
              <Text variant="label" numberOfLines={1} style={styles.name}>
                {name}
              </Text>
              <Text variant="label">{fmt.money(share)}</Text>
            </View>
          );
        })}
      </Card>
    </FormSection>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    gap: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  name: {
    flex: 1,
  },
}));
