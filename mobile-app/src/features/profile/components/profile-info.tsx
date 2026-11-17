import { Coins, HardDrive, Languages, Lock, Smartphone } from 'lucide-react-native';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { useBontonStore } from '@/shared/store/bonton-store';
import { Card, Text } from '@/shared/ui';

export function ProfileInfo() {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const language = useBontonStore((s) => s.language);
  const currency = useBontonStore((s) => s.currency);

  const langLabel = language === 'bn' ? 'বাংলা' : 'English';

  const rows = [
    {
      icon: HardDrive,
      label: t('profile.storageMode'),
      value: t('profile.localStorage'),
    },
    {
      icon: Lock,
      label: t('profile.encryption'),
      value: t('profile.localOnly'),
    },
    {
      icon: Coins,
      label: t('settings.currency'),
      value: `${currency} (${t(`settings.currencies.${currency}`)})`,
    },
    {
      icon: Languages,
      label: t('settings.language'),
      value: langLabel,
    },
    {
      icon: Smartphone,
      label: t('profile.appVersion'),
      value: t('profile.versionNumber'),
    },
  ];

  return (
    <Animated.View entering={FadeInDown.duration(300).delay(250)} style={styles.container}>
      <Text variant="heading" style={styles.sectionTitle}>
        {t('profile.accountInfo')}
      </Text>

      <Card style={styles.card}>
        {rows.map((row, index) => {
          const Icon = row.icon;
          const isLast = index === rows.length - 1;
          return (
            <View key={row.label} style={[styles.row, !isLast && styles.rowBorder]}>
              <View style={styles.left}>
                <View style={[styles.iconWell, { backgroundColor: theme.colors.primaryMuted }]}>
                  <Icon size={18} color={theme.colors.primaryText} strokeWidth={2.2} />
                </View>
                <Text variant="label" style={styles.label}>
                  {row.label}
                </Text>
              </View>

              <Text variant="caption" tone="secondary" style={styles.value} numberOfLines={1}>
                {row.value}
              </Text>
            </View>
          );
        })}
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    gap: theme.spacing.md,
  },
  sectionTitle: {
    fontWeight: theme.typography.weight.bold,
  },
  card: {
    padding: 0,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
  },
  iconWell: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: theme.typography.weight.medium,
  },
  value: {
    fontWeight: theme.typography.weight.semibold,
  },
}));
