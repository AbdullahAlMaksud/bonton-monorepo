import { Trash2, UserPlus } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native-unistyles';

import { useFormatters } from '@/shared/hooks/use-formatters';
import { haptics } from '@/shared/lib/haptics';
import type { Group, Member, MemberBalance } from '@/shared/types/bonton';
import { Avatar, Card, IconButton, Text, TextField } from '@/shared/ui';

export interface BalancesListProps {
  group: Group;
  balances: MemberBalance[];
  onRemoveMember: (member: Member) => void;
  /** Returns an error message to show under the input, or null on success. */
  onAddMember: (name: string) => string | null;
}

export function BalancesList({ group, balances, onRemoveMember, onAddMember }: BalancesListProps) {
  const { t } = useTranslation();
  const fmt = useFormatters();
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  const balanceById = new Map(balances.map((b) => [b.memberId, b.balance]));

  const submit = () => {
    if (draft.trim() === '') return;
    const message = onAddMember(draft);
    if (message) {
      haptics.warning();
      setError(message);
      return;
    }
    haptics.success();
    setDraft('');
    setError(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.list}>
        {group.members.map((member) => {
          const balance = balanceById.get(member.id) ?? 0;
          const status =
            balance > 0
              ? t('group.balanceOwed', { amount: fmt.money(balance) })
              : balance < 0
                ? t('group.balanceOwes', { amount: fmt.money(-balance) })
                : t('group.balanceSettled');
          const tone = balance > 0 ? 'success' : balance < 0 ? 'danger' : 'secondary';
          const name = fmt.memberName(member);

          return (
            <Card key={member.id} style={styles.row}>
              <Avatar name={name} highlight={member.isMe} />
              <View style={styles.body}>
                <Text variant="label" numberOfLines={1}>
                  {name}
                </Text>
                <Text variant="caption" tone={tone}>
                  {status}
                </Text>
              </View>
              {member.isMe ? null : (
                <IconButton
                  icon={Trash2}
                  tone="danger"
                  label={`${t('common.remove')} ${name}`}
                  onPress={() => onRemoveMember(member)}
                />
              )}
            </Card>
          );
        })}
      </View>

      <View style={styles.add}>
        <TextField
          containerStyle={styles.addField}
          placeholder={t('group.addMemberPlaceholder')}
          value={draft}
          onChangeText={(text) => {
            setDraft(text);
            if (error) setError(null);
          }}
          onSubmitEditing={submit}
          error={error}
          maxLength={30}
          returnKeyType="done"
          blurOnSubmit={false}
        />
        <IconButton icon={UserPlus} tone="primary" label={t('common.add')} onPress={submit} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    gap: theme.spacing.lg,
  },
  list: {
    gap: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  add: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  addField: {
    flex: 1,
  },
}));
