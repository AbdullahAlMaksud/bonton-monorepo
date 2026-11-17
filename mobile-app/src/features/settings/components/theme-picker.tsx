import { Check } from 'lucide-react-native';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { haptics } from '@/shared/lib/haptics';
import { THEME_NAMES, themes, type ThemeName } from '@/shared/theme/themes';
import { PressableScale, Text } from '@/shared/ui';

export interface ThemePickerProps {
  value: ThemeName;
  onChange: (theme: ThemeName) => void;
}

export function ThemePicker({ value, onChange }: ThemePickerProps) {
  return (
    <View style={styles.grid} accessibilityRole="radiogroup">
      {THEME_NAMES.map((name) => (
        <ThemeTile key={name} name={name} selected={name === value} onPress={() => onChange(name)} />
      ))}
    </View>
  );
}

interface ThemeTileProps {
  name: ThemeName;
  selected: boolean;
  onPress: () => void;
}

function ThemeTile({ name, selected, onPress }: ThemeTileProps) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  styles.useVariants({ selected });
  // Previews show the OTHER theme's own colors, so they are intentionally not tied to the active theme.
  const preview = themes[name].colors;
  const label = t(`settings.themes.${name}`);

  return (
    <PressableScale
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      scaleTo={0.96}
      onPress={() => {
        if (selected) return;
        haptics.select();
        onPress();
      }}
      style={styles.tile}
    >
      <View style={[styles.swatch, { backgroundColor: preview.background, borderColor: preview.border }]}>
        <View style={[styles.swatchCard, { backgroundColor: preview.card, borderColor: preview.border }]}>
          <View style={[styles.dot, { backgroundColor: preview.primary }]} />
          <View style={[styles.line, { backgroundColor: preview.textSecondary }]} />
        </View>
        <View style={[styles.swatchBar, { backgroundColor: preview.primary }]} />
      </View>
      <View style={styles.labelRow}>
        <Text variant="label" tone={selected ? 'primary' : 'default'}>
          {label}
        </Text>
        {selected ? <Check size={16} color={theme.colors.primaryText} strokeWidth={3} /> : null}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create((theme) => ({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  tile: {
    // Two columns on phones, three on wider screens.
    flexGrow: 1,
    flexBasis: '45%',
    gap: theme.spacing.sm,
    padding: theme.spacing.sm,
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    backgroundColor: theme.colors.card,
    variants: {
      selected: {
        true: { borderColor: theme.colors.primary },
        false: { borderColor: theme.colors.border },
      },
    },
  },
  swatch: {
    height: 76,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    padding: theme.spacing.sm,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  swatchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.sm,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  line: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    opacity: 0.6,
  },
  swatchBar: {
    height: 8,
    width: '55%',
    borderRadius: 4,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xs,
    minHeight: 24,
  },
}));
