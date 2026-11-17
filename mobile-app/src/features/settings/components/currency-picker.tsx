import { Check } from 'lucide-react-native';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { haptics } from '@/shared/lib/haptics';
import { CURRENCIES } from '@/shared/lib/money';
import { CURRENCY_CODES, type CurrencyCode } from '@/shared/types/bonton';
import { PressableScale, Text } from '@/shared/ui';

export interface CurrencyPickerProps {
  value: CurrencyCode;
  onChange: (currency: CurrencyCode) => void;
}

export function CurrencyPicker({ value, onChange }: CurrencyPickerProps) {
  return (
    <View style={styles.list} accessibilityRole="radiogroup">
      {CURRENCY_CODES.map((code) => (
        <CurrencyRow key={code} code={code} selected={code === value} onPress={() => onChange(code)} />
      ))}
    </View>
  );
}

interface CurrencyRowProps {
  code: CurrencyCode;
  selected: boolean;
  onPress: () => void;
}

function CurrencyRow({ code, selected, onPress }: CurrencyRowProps) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  styles.useVariants({ selected });
  const name = t(`settings.currencies.${code}`);

  return (
    <PressableScale
      accessibilityRole="radio"
      accessibilityLabel={`${name} ${CURRENCIES[code].symbol}`}
      accessibilityState={{ selected }}
      scaleTo={0.985}
      onPress={() => {
        if (selected) return;
        haptics.select();
        onPress();
      }}
      style={styles.row}
    >
      <View style={styles.symbolWell}>
        <Text variant="heading" tone="primary">
          {CURRENCIES[code].symbol}
        </Text>
      </View>
      <View style={styles.text}>
        <Text variant="label">{name}</Text>
        <Text variant="caption" tone="secondary">
          {code}
        </Text>
      </View>
      {selected ? <Check size={20} color={theme.colors.primaryText} strokeWidth={3} /> : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create((theme) => ({
  list: {
    gap: theme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    minHeight: 60,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
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
  symbolWell: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryMuted,
  },
  text: {
    flex: 1,
  },
}));
