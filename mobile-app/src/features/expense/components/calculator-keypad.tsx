import { Delete } from 'lucide-react-native';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native-unistyles';

import { haptics } from '@/shared/lib/haptics';
import { toBengaliDigits } from '@/shared/lib/money';
import { PressableScale, Text } from '@/shared/ui';

export interface CalculatorKeypadProps {
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
  onClear: () => void;
}

const KEYPAD_ROWS = [
  ['7', '8', '9', '÷'],
  ['4', '5', '6', '×'],
  ['1', '2', '3', '−'],
  ['0', '.', '=', '+'],
] as const;

export function CalculatorKeypad({
  onKeyPress,
  onBackspace,
  onClear,
}: CalculatorKeypadProps) {
  const { i18n } = useTranslation();
  const isBn = i18n.language === 'bn';

  const handlePress = (key: string) => {
    haptics.tap();
    onKeyPress(key);
  };

  return (
    <View style={styles.grid}>
      {KEYPAD_ROWS.map((row, rowIdx) => (
        <View key={rowIdx} style={styles.row}>
          {row.map((key) => {
            const isOperator = ['÷', '×', '−', '+'].includes(key);
            const isEquals = key === '=';

            const displayLabel = isBn && !isOperator && key !== '.' && key !== '='
              ? toBengaliDigits(key)
              : key;

            return (
              <PressableScale
                key={key}
                scaleTo={0.92}
                onPress={() => handlePress(key)}
                style={[
                  styles.keyButton,
                  isOperator && styles.operatorButton,
                  isEquals && styles.equalsButton,
                ]}
                accessibilityLabel={
                  isEquals
                    ? 'Calculate'
                    : isOperator
                      ? `Operator ${key}`
                      : `Digit ${key}`
                }
              >
                <Text
                  style={[
                    styles.keyText,
                    isOperator && styles.operatorText,
                    isEquals && styles.equalsText,
                  ]}
                >
                  {displayLabel}
                </Text>
              </PressableScale>
            );
          })}
        </View>
      ))}
    </View>
  );
}

export interface AmountDisplayProps {
  currency: string;
  expression: string;
  onBackspace: () => void;
  onClear: () => void;
}

export function AmountDisplay({
  currency,
  expression,
  onBackspace,
  onClear,
}: AmountDisplayProps) {
  const { i18n } = useTranslation();
  const isBn = i18n.language === 'bn';

  const handleBackspacePress = () => {
    haptics.tap();
    onBackspace();
  };

  const handleBackspaceLongPress = () => {
    haptics.warning();
    onClear();
  };

  const displayExpression = expression
    ? (isBn ? toBengaliDigits(expression) : expression)
    : (isBn ? '০' : '0');

  return (
    <View style={styles.amountContainer}>
      {/* Currency Badge */}
      <View style={styles.currencyBadge}>
        <Text style={styles.currencySymbol}>{currency}</Text>
      </View>

      {/* Number / Expression Display */}
      <View style={styles.expressionWrapper}>
        <Text style={styles.amountText} numberOfLines={1} adjustsFontSizeToFit>
          {displayExpression}
        </Text>
      </View>

      {/* Backspace Button */}
      <PressableScale
        scaleTo={0.88}
        onPress={handleBackspacePress}
        onLongPress={handleBackspaceLongPress}
        style={styles.backspaceButton}
        accessibilityLabel="Delete last character or hold to clear"
      >
        <Delete size={22} color="#6B7280" />
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  /* --- Keypad Grid --- */
  grid: {
    gap: 10,
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  keyButton: {
    flex: 1,
    height: 68,
    borderRadius: 16,
    backgroundColor: theme.isDark ? theme.colors.card : '#F3F4F6',
    borderWidth: 1,
    borderColor: theme.isDark ? theme.colors.border : 'rgba(0,0,0,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  operatorButton: {
    backgroundColor: theme.isDark ? theme.colors.card : '#F3F4F6',
    borderColor: theme.isDark ? theme.colors.border : 'rgba(0,0,0,0.03)',
  },
  equalsButton: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  keyText: {
    fontSize: 28,
    fontWeight: '600',
    color: theme.colors.text,
  },
  operatorText: {
    color: theme.colors.text,
    fontWeight: '600',
    fontSize: 28,
  },
  equalsText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 28,
  },

  /* --- Amount Display Container --- */
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.isDark ? theme.colors.card : '#F3F4F6',
    borderRadius: 18,
    paddingHorizontal: 14,
    height: 64,
    borderWidth: 1,
    borderColor: theme.isDark ? theme.colors.border : 'rgba(0,0,0,0.04)',
  },
  currencyBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.isDark ? theme.colors.border : 'rgba(0,0,0,0.04)',
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  expressionWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  amountText: {
    fontSize: 30,
    fontWeight: '700',
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  backspaceButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.isDark ? theme.colors.border : 'rgba(0,0,0,0.04)',
  },
}));