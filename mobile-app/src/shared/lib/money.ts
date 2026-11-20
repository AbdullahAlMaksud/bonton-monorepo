/**
 * Money and number formatting / parsing. Integer-only: text is parsed into minor
 * units with string arithmetic, never through parseFloat.
 */
import type { Cents, CurrencyCode, LangCode } from '../types/bonton';
import { MAX_AMOUNT } from './settlement';

export interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  /** BDT and INR group digits as 12,34,567; the others as 1,234,567. */
  grouping: 'indian' | 'international';
}

export const CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  BDT: { code: 'BDT', symbol: '৳', grouping: 'indian' },
  USD: { code: 'USD', symbol: '$', grouping: 'international' },
  EUR: { code: 'EUR', symbol: '€', grouping: 'international' },
  INR: { code: 'INR', symbol: '₹', grouping: 'indian' },
  GBP: { code: 'GBP', symbol: '£', grouping: 'international' },
};

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'] as const;

export function toBengaliDigits(text: string | number): string {
  return String(text).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)] ?? d);
}

export function toAsciiDigits(text: string): string {
  return text.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d as (typeof BN_DIGITS)[number])));
}

export function localizeDigits(text: string | number, lang: LangCode): string {
  return lang === 'bn' ? toBengaliDigits(text) : String(text);
}

function groupInternational(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function groupIndian(digits: string): string {
  if (digits.length <= 3) return digits;
  const lastThree = digits.slice(-3);
  let rest = digits.slice(0, -3);
  const parts: string[] = [];
  while (rest.length > 2) {
    parts.unshift(rest.slice(-2));
    rest = rest.slice(0, -2);
  }
  if (rest.length > 0) parts.unshift(rest);
  return [...parts, lastThree].join(',');
}

/** "৳1,200" or "৳1,200.50" (decimals only when non-zero). Digits localized for Bengali. */
export function formatMoney(minor: Cents, currency: CurrencyCode, lang: LangCode): string {
  const { symbol, grouping } = CURRENCIES[currency];
  const negative = minor < 0;
  const abs = Math.abs(minor);
  const whole = Math.floor(abs / 100);
  const fraction = abs % 100;

  const wholeText = grouping === 'indian' ? groupIndian(String(whole)) : groupInternational(String(whole));
  const fractionText = fraction === 0 ? '' : `.${String(fraction).padStart(2, '0')}`;
  return localizeDigits(`${negative ? '-' : ''}${symbol}${wholeText}${fractionText}`, lang);
}

/** Basis points → "33.33" / "50" (digits localized). */
export function formatBps(bps: number, lang: LangCode): string {
  const whole = Math.floor(bps / 100);
  const fraction = bps % 100;
  const text = fraction === 0 ? String(whole) : `${whole}.${String(fraction).padStart(2, '0').replace(/0$/, '')}`;
  return localizeDigits(text, lang);
}

export function formatCount(value: number, lang: LangCode): string {
  return localizeDigits(String(value), lang);
}

/** "16 Nov 2026" with localized month names (passed in from i18n) and digits. */
export function formatDate(timestamp: number, lang: LangCode, months: readonly string[]): string {
  const date = new Date(timestamp);
  const month = months[date.getMonth()] ?? '';
  return localizeDigits(`${date.getDate()} ${month} ${date.getFullYear()}`, lang);
}

/* -------------------------------------------------------------------------- */
/* Input handling                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Keep only digits and one decimal point (max 2 decimals). Bengali digits are
 * converted to ASCII so the text can always be parsed the same way.
 */
export function sanitizeDecimalInput(text: string): string {
  const ascii = toAsciiDigits(text).replace(/,/g, '.').replace(/[^0-9.]/g, '');
  const firstDot = ascii.indexOf('.');
  if (firstDot === -1) return ascii.slice(0, 13);
  const whole = ascii.slice(0, firstDot).slice(0, 13);
  const fraction = ascii.slice(firstDot + 1).replace(/\./g, '').slice(0, 2);
  return `${whole}.${fraction}`;
}

/**
 * "120.5" → 12050. Used for money (minor units) and percentages (basis points)
 * — both are value × 100. Returns null for empty / invalid text.
 */
export function parseMinorUnits(text: string): number | null {
  const clean = sanitizeDecimalInput(text);
  if (clean === '' || clean === '.') return null;
  const [wholeText = '', fractionText = ''] = clean.split('.');
  const whole = wholeText === '' ? 0 : Number(wholeText);
  const fraction = Number(fractionText.padEnd(2, '0'));
  const value = whole * 100 + fraction;
  if (!Number.isSafeInteger(value) || value > MAX_AMOUNT) return null;
  return value;
}

/** 12050 → "120.5", 12000 → "120". Inverse of parseMinorUnits, for prefilling inputs. */
export function minorToInputString(minor: number): string {
  const whole = Math.floor(minor / 100);
  const fraction = minor % 100;
  if (fraction === 0) return String(whole);
  return `${whole}.${String(fraction).padStart(2, '0').replace(/0$/, '')}`;
}
