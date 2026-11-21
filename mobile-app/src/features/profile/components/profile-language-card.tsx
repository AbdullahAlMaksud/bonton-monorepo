import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useTranslation } from 'react-i18next';

import { haptics } from '@/shared/lib/haptics';
import { useBontonStore } from '@/shared/store/bonton-store';
import type { LangCode } from '@/shared/types/bonton';
import { Text } from '@/shared/ui';

export function ProfileLanguageCard() {
  const { t } = useTranslation();
  const activeLanguage = useBontonStore((s) => s.language);
  const setLanguage = useBontonStore((s) => s.setLanguage);

  const handleSelectLanguage = (lang: LangCode) => {
    if (activeLanguage === lang) return;
    haptics.select();
    setLanguage(lang);
  };

  return (
    <View style={styles.section}>
      <Text variant="heading" style={styles.sectionTitle}>
        {t('profile.appLanguage')}
      </Text>

      <View style={styles.card}>



        {/* English Option */}
        <Pressable
          onPress={() => handleSelectLanguage('en')}
          style={({ pressed }) => [
            styles.optionRow,
            activeLanguage === 'en' && styles.optionRowActive,
            pressed && styles.rowPressed,
          ]}
        >
          <View style={styles.optionLeft}>
            <View
              style={[
                styles.langBadge,
                activeLanguage === 'en' && styles.langBadgeActive,
              ]}
            >
              <Text
                variant="caption"
                style={[
                  styles.langBadgeText,
                  activeLanguage === 'en' && styles.langBadgeTextActive,
                ]}
              >
                EN
              </Text>
            </View>

            <View style={styles.textGroup}>
              <Text variant="body" style={styles.optionTitle}>
                {t('profile.english')}
              </Text>
            </View>
          </View>

          {/* Radio button */}
          <View
            style={[
              styles.radioCircle,
              activeLanguage === 'en' && styles.radioCircleActive,
            ]}
          >
            {activeLanguage === 'en' && <View style={styles.radioDot} />}
          </View>
        </Pressable>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Bengali Option */}
        <Pressable
          onPress={() => handleSelectLanguage('bn')}
          style={({ pressed }) => [
            styles.optionRow,
            activeLanguage === 'bn' && styles.optionRowActive,
            pressed && styles.rowPressed,
          ]}
        >
          <View style={styles.optionLeft}>
            <View
              style={[
                styles.langBadge,
                activeLanguage === 'bn' && styles.langBadgeActive,
              ]}
            >
              <Text
                variant="caption"
                style={[
                  styles.langBadgeText,
                  activeLanguage === 'bn' && styles.langBadgeTextActive,
                ]}
              >
                BN
              </Text>
            </View>

            <View style={styles.textGroup}>
              <Text variant="body" style={styles.optionTitle}>
                {t('profile.bangla')}
              </Text>
            </View>
          </View>

          {/* Radio button */}
          <View
            style={[
              styles.radioCircle,
              activeLanguage === 'bn' && styles.radioCircleActive,
            ]}
          >
            {activeLanguage === 'bn' && <View style={styles.radioDot} />}
          </View>
        </Pressable>


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
    overflow: 'hidden',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: theme.isDark ? 0.25 : 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  optionRowActive: {
    backgroundColor: theme.colors.primaryMuted,
  },
  rowPressed: {
    opacity: 0.75,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  langBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langBadgeActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.card,
  },
  langBadgeText: {
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  langBadgeTextActive: {
    color: theme.colors.primary,
  },
  textGroup: {
    gap: 2,
  },
  optionTitle: {
    fontWeight: theme.typography.weight.medium,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: theme.colors.primary,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: 16,
  },
}));
