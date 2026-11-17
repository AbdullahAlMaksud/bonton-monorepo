import { useTranslation } from 'react-i18next';

import { useFormatters } from '@/shared/hooks/use-formatters';
import type { Cents } from '@/shared/types/bonton';
import { Text } from '@/shared/ui';

export interface AmountDiffProps {
  /** Target minus entered, in minor units. Positive = still unassigned, negative = over. */
  diff: Cents;
}

/** "Still unassigned: ৳500" / "Over by ৳20", or a calm confirmation when it adds up. */
export function AmountDiff({ diff }: AmountDiffProps) {
  const { t } = useTranslation();
  const fmt = useFormatters();

  if (diff === 0) return null;
  return (
    <Text variant="caption" tone="warning" accessibilityLiveRegion="polite">
      {diff > 0 ? t('expense.unassigned', { amount: fmt.money(diff) }) : t('expense.overBy', { amount: fmt.money(-diff) })}
    </Text>
  );
}
