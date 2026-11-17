import { CURRENCIES, localizeDigits, sanitizeDecimalInput } from '@/shared/lib/money';
import { useBontonStore } from '@/shared/store/bonton-store';

import { TextField, type TextFieldProps } from './text-field';

type BaseProps = Omit<TextFieldProps, 'value' | 'onChangeText' | 'keyboardType' | 'inputMode'>;

export interface DecimalInputProps extends BaseProps {
  /** Always ASCII ("120.5"). Bengali digits are only used for display. */
  value: string;
  onChangeText: (value: string) => void;
}

/**
 * Numeric input that keeps the underlying string ASCII (so it can be parsed to
 * integer minor units) while displaying Bengali digits when the app language is Bengali.
 * Typing Bengali digits (e.g. from a Bangla keyboard) is accepted and normalized.
 */
export function DecimalInput({ value, onChangeText, ...rest }: DecimalInputProps) {
  const language = useBontonStore((s) => s.language);
  return (
    <TextField
      {...rest}
      inputMode="decimal"
      keyboardType="decimal-pad"
      value={localizeDigits(value, language)}
      onChangeText={(text) => onChangeText(sanitizeDecimalInput(text))}
      selectTextOnFocus
    />
  );
}

/** DecimalInput prefixed with the active currency symbol. */
export function MoneyInput(props: DecimalInputProps) {
  const currency = useBontonStore((s) => s.currency);
  return <DecimalInput placeholder="0" prefix={CURRENCIES[currency].symbol} {...props} />;
}

/** DecimalInput suffixed with "%". Value is a plain percentage string ("33.33"). */
export function PercentInput(props: DecimalInputProps) {
  return <DecimalInput placeholder="0" suffix="%" {...props} />;
}
