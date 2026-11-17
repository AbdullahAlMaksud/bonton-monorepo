import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { useFormatters } from '@/shared/hooks/use-formatters';
import type { Member } from '@/shared/types/bonton';
import { Avatar, MoneyInput, PercentInput, Text } from '@/shared/ui';

export interface MemberAmountRowProps {
  member: Member;
  value: string;
  onChangeText: (value: string) => void;
  kind: 'money' | 'percent';
}

/** One member with a numeric input: used for payers, personal bills, percentages and custom amounts. */
export function MemberAmountRow({ member, value, onChangeText, kind }: MemberAmountRowProps) {
  const fmt = useFormatters();
  const name = fmt.memberName(member);
  const Input = kind === 'money' ? MoneyInput : PercentInput;

  return (
    <View style={styles.row}>
      <Avatar name={name} highlight={member.isMe} size={36} />
      <Text variant="label" numberOfLines={1} style={styles.name}>
        {name}
      </Text>
      <View style={styles.input}>
        <Input accessibilityLabel={name} value={value} onChangeText={onChangeText} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  name: {
    flex: 1,
  },
  input: {
    width: 148,
  },
}));
