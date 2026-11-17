import { ArrowDownLeft, ArrowUpRight } from 'lucide-react-native';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { useFormatters } from '@/shared/hooks/use-formatters';
import { Text } from '@/shared/ui';
import type { Cents } from '@/shared/types/bonton';

export interface SummaryCardsProps {
  totalOwedToMe: Cents;
  totalIOwe: Cents;
}

export function SummaryCards({ totalOwedToMe, totalIOwe }: SummaryCardsProps) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const fmt = useFormatters();

  return (
    <View style={styles.row}>
      <Animated.View entering={FadeInDown.duration(300)} style={[styles.card, styles.owed]}>
        <View style={[styles.icon, styles.owedIcon]}>
          <ArrowDownLeft size={20} color={theme.colors.success} strokeWidth={2.4} />
        </View>
        <Text variant="label" tone="secondary">
          {t('dashboard.youAreOwed')}
        </Text>
        <Text variant="title" tone="success" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
          {fmt.money(totalOwedToMe)}
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(300).delay(70)} style={[styles.card, styles.owe]}>
        <View style={[styles.icon, styles.oweIcon]}>
          <ArrowUpRight size={20} color={theme.colors.danger} strokeWidth={2.4} />
        </View>
        <Text variant="label" tone="secondary">
          {t('dashboard.youOwe')}
        </Text>
        <Text variant="title" tone="danger" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
          {fmt.money(totalIOwe)}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  card: {
    flex: 1,
    gap: theme.spacing.xs,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  owed: {},
  owe: {},
  icon: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xs,
  },
  owedIcon: { backgroundColor: theme.colors.successMuted },
  oweIcon: { backgroundColor: theme.colors.dangerMuted },
}));
