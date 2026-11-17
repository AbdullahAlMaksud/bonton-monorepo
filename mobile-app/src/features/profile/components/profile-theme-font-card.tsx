import { ChevronRight, Moon, Palette, Sun } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useTranslation } from 'react-i18next';

import { haptics } from '@/shared/lib/haptics';
import { useBontonStore } from '@/shared/store/bonton-store';
import { getFontDisplayName, getFontSubtitle } from '@/shared/theme/fonts';
import { Text } from '@/shared/ui';

interface ProfileThemeFontCardProps {
  onOpenThemeModal: () => void;
  onOpenFontModal: () => void;
}

export function ProfileThemeFontCard({
  onOpenThemeModal,
  onOpenFontModal,
}: ProfileThemeFontCardProps) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const activeTheme = useBontonStore((s) => s.theme);
  const activeFont = useBontonStore((s) => s.font);
  const language = useBontonStore((s) => s.language);

  const isBn = language === 'bn';

  const themeDisplayNames: Record<string, string> = {
    light: isBn ? 'লাইট থিম' : 'Light Theme',
    dark: isBn ? 'ডার্ক থিম' : 'Dark Theme',
    sepia: isBn ? 'সেপিয়া থিম' : 'Sepia Theme',
    forest: isBn ? 'ফরেস্ট থিম' : 'Forest Theme',
    ocean: isBn ? 'ওশান থিম' : 'Ocean Theme',
  };

  const handlePressTheme = () => {
    haptics.tap();
    onOpenThemeModal();
  };

  const handlePressFont = () => {
    haptics.tap();
    onOpenFontModal();
  };

  const fontDisplayName = getFontDisplayName(activeFont, isBn);
  const fontSubtitle = getFontSubtitle(activeFont);

  return (
    <View style={styles.section}>
      <Text variant="heading" style={styles.sectionTitle}>
        {t('profile.themeAndFont')}
      </Text>

      <View style={styles.card}>
        {/* Row 1: Theme Setting */}
        <Pressable
          onPress={handlePressTheme}
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        >
          <View style={styles.rowLeft}>
            <View style={styles.iconContainer}>
              <Palette size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.textGroup}>
              <Text variant="body" style={styles.rowTitle}>
                {t('profile.themeSetting')}
              </Text>
              <Text variant="caption" tone="secondary">
                {themeDisplayNames[activeTheme] ?? activeTheme}
              </Text>
            </View>
          </View>

          <View style={styles.rowRight}>
            <View style={styles.activePill}>
              {activeTheme === 'dark' ? (
                <Moon size={13} color={theme.colors.primary} />
              ) : (
                <Sun size={13} color={theme.colors.primary} />
              )}
              <Text variant="caption" style={styles.activePillText}>
                {themeDisplayNames[activeTheme] ?? activeTheme}
              </Text>
            </View>
            <ChevronRight size={18} color={theme.colors.textSecondary} />
          </View>
        </Pressable>

        <View style={styles.divider} />

        {/* Row 2: Font Setting */}
        <Pressable
          onPress={handlePressFont}
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        >
          <View style={styles.rowLeft}>
            <View style={styles.iconContainer}>
              <Text variant="label" style={styles.fontIconText}>
                Aa
              </Text>
            </View>
            <View style={styles.textGroup}>
              <Text variant="body" style={styles.rowTitle}>
                {t('profile.fontSetting')}
              </Text>
              <Text variant="caption" tone="secondary">
                {fontSubtitle}
              </Text>
            </View>
          </View>

          <View style={styles.rowRight}>
            <Text variant="label" style={styles.activeFontPillText}>
              {fontDisplayName}
            </Text>
            <ChevronRight size={18} color={theme.colors.textSecondary} />
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
  rowPressed: {
    opacity: 0.75,
    backgroundColor: theme.colors.background,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
    marginRight: 8,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fontIconText: {
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.primary,
  },
  textGroup: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontWeight: theme.typography.weight.medium,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: theme.colors.primaryMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  activePillText: {
    fontWeight: theme.typography.weight.medium,
    color: theme.colors.primary,
    fontSize: 12,
  },
  activeFontPillText: {
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.text,
    fontSize: 13,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: 16,
  },
}));
