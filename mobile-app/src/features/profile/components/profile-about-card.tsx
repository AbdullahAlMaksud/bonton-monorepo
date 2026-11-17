import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useTranslation } from 'react-i18next';

import { Text } from '@/shared/ui';

export function ProfileAboutCard() {
  const { t } = useTranslation();

  return (
    <View style={styles.section}>
      <Text variant="heading" style={styles.sectionTitle}>
        {t('profile.aboutApp')}
      </Text>

      <View style={styles.card}>
        {/* Row 1: Version */}
        <View style={styles.row}>
          <Text variant="body" style={styles.rowLabel}>
            {t('profile.version')}
          </Text>
          <Text variant="label" tone="secondary">
            {t('profile.versionValue')}
          </Text>
        </View>

        <View style={styles.divider} />

        {/* Row 2: Creator */}
        <View style={styles.row}>
          <Text variant="body" style={styles.rowLabel}>
            {t('profile.developer')}
          </Text>
          <Text variant="label" style={styles.creatorText}>
            {t('profile.developerName')}
          </Text>
        </View>

        <View style={styles.divider} />

        {/* Row 3: Storage */}
        <View style={styles.row}>
          <Text variant="body" style={styles.rowLabel}>
            {t('profile.dataStorage')}
          </Text>
          <Text variant="label" tone="secondary">
            {t('profile.dataStorageValue')}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  section: {
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: theme.typography.weight.bold,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 4,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: theme.isDark ? 0.25 : 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowLabel: {
    fontWeight: theme.typography.weight.medium,
  },
  creatorText: {
    color: theme.colors.primary,
    fontWeight: theme.typography.weight.semibold,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: 16,
  },
}));
