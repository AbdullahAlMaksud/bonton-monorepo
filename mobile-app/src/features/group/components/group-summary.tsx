import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native-unistyles';

import { useFormatters } from '@/shared/hooks/use-formatters';
import type { Cents } from '@/shared/types/bonton';
import { GroupIcon, Text } from '@/shared/ui';
import type { GroupIconName } from '@/shared/types/bonton';

export interface GroupSummaryProps {
  icon: GroupIconName;
  name: string;
  totalSpent: Cents;
  myBalance: Cents;
}

export function GroupSummary({ icon, name, totalSpent, myBalance }: GroupSummaryProps) {
  const { t } = useTranslation();
  const fmt = useFormatters();
  const tone = myBalance > 0 ? 'success' : myBalance < 0 ? 'danger' : 'secondary';

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <GroupIcon name={icon} size="lg" />
        <Text variant="heading" numberOfLines={2} style={styles.name}>
          {name}
        </Text>
      </View>
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text variant="caption" tone="secondary">
            {t('group.totalSpent')}
          </Text>
          <Text variant="heading" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            {fmt.money(totalSpent)}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text variant="caption" tone="secondary">
            {t('group.yourBalance')}
          </Text>
          <Text variant="heading" tone={tone} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            {fmt.money(myBalance)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    gap: theme.spacing.lg,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  name: {
    flex: 1,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    gap: 2,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    marginHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.border,
  },
}));
