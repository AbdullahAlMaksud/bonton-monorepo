import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { formatBps, formatCount, formatDate, formatMoney } from '@/shared/lib/money';
import { useBontonStore } from '@/shared/store/bonton-store';
import type { Cents, Member } from '@/shared/types/bonton';

/** Locale-aware formatters bound to the user's chosen language and currency. */
export function useFormatters() {
  const language = useBontonStore((s) => s.language);
  const currency = useBontonStore((s) => s.currency);
  const { t } = useTranslation();

  return useMemo(() => {
    const months = t('months').split(',');
    return {
      language,
      currency,
      money: (minor: Cents) => formatMoney(minor, currency, language),
      bps: (value: number) => formatBps(value, language),
      count: (value: number) => formatCount(value, language),
      date: (timestamp: number) => formatDate(timestamp, language, months),
      /** The current user is shown as a localized "You"; others by their typed name. */
      memberName: (member: Pick<Member, 'isMe' | 'name'>) => (member.isMe ? t('common.you') : member.name),
    };
  }, [language, currency, t]);
}

export type Formatters = ReturnType<typeof useFormatters>;
