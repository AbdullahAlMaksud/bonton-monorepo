/**
 * Domain types for Bonton.
 *
 * Every monetary value is an INTEGER in minor units (poisha / cents / pence).
 * There is no floating point money anywhere in the domain layer.
 */

/** Integer minor units (e.g. 12050 === 120.50). */
export type Cents = number;
export type MemberId = string;
export type GroupId = string;
export type ExpenseId = string;

export const GROUP_ICON_NAMES = ['wallet', 'plane', 'utensils', 'home', 'sparkles'] as const;
export type GroupIconName = (typeof GROUP_ICON_NAMES)[number];

export const CURRENCY_CODES = ['BDT', 'USD', 'EUR', 'INR', 'GBP'] as const;
export type CurrencyCode = (typeof CURRENCY_CODES)[number];

export const LANGUAGE_CODES = ['bn', 'en'] as const;
export type LangCode = (typeof LANGUAGE_CODES)[number];

export const FONT_NAMES = [
  'system',
  'hind-siliguri',
  'noto-serif-bengali',
  'inter',
  'playfair',
] as const;
export type FontName = (typeof FONT_NAMES)[number];

export interface Member {
  id: MemberId;
  /** Display name. Ignored for the current user (`isMe`) — the UI shows a localized "You". */
  name: string;
  isMe: boolean;
}

/** Someone who actually paid part (or all) of an expense. Σ payers.amount === expense.amount. */
export interface PayerShare {
  memberId: MemberId;
  amount: Cents;
}

/** An amount only one person is responsible for. Deducted before the shared split. */
export interface PersonalBill {
  memberId: MemberId;
  amount: Cents;
}

export type SplitType = 'equal' | 'percentage' | 'custom';

export interface PercentageEntry {
  memberId: MemberId;
  /** Basis points: 3333 === 33.33 %. Entries are normalized to 100 % when computing. */
  bps: number;
}

export interface CustomEntry {
  memberId: MemberId;
  /** Fixed share of the shared amount. Σ entries must equal the shared amount. */
  amount: Cents;
}

export type SplitConfig =
  | { type: 'equal'; participantIds: MemberId[] }
  | { type: 'percentage'; entries: PercentageEntry[] }
  | { type: 'custom'; entries: CustomEntry[] };

/** The part of an expense the calculation engine needs. */
export interface ExpenseCore {
  /** Total bill, including personal bills. */
  amount: Cents;
  payers: PayerShare[];
  personalBills: PersonalBill[];
  split: SplitConfig;
}

export interface ExpenseInput extends ExpenseCore {
  title: string;
  note?: string;
}

export interface Expense extends ExpenseInput {
  id: ExpenseId;
  createdAt: number;
  updatedAt: number;
}

export interface Group {
  id: GroupId;
  name: string;
  icon: GroupIconName;
  members: Member[];
  expenses: Expense[];
  createdAt: number;
  updatedAt: number;
}

/** "from" pays "to" this much to settle up. */
export interface Transfer {
  from: MemberId;
  to: MemberId;
  amount: Cents;
}

/** Positive = is owed money (creditor). Negative = owes money (debtor). */
export interface MemberBalance {
  memberId: MemberId;
  balance: Cents;
}

export interface GroupSummary {
  groupId: GroupId;
  /** Current user's net balance in this group. */
  myBalance: Cents;
  totalSpent: Cents;
}

export interface DashboardSummary {
  totalOwedToMe: Cents;
  totalIOwe: Cents;
  net: Cents;
  groups: GroupSummary[];
}
