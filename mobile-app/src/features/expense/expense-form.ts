/**
 * Pure form logic for the expense screen: text fields in, validated ExpenseInput out.
 * No React, no store — everything here is unit-tested.
 *
 * Form values are strings (what the user typed, ASCII digits). They are parsed to
 * integer minor units with `parseMinorUnits`; percentages use the same parser and are
 * therefore basis points (33.33 % → 3333).
 */
import { minorToInputString, parseMinorUnits } from '@/shared/lib/money';
import {
  computeShares,
  normalizeBps,
  splitEqually,
  type Result,
} from '@/shared/lib/settlement';
import type {
  Cents,
  Expense,
  ExpenseInput,
  Member,
  MemberId,
  PayerShare,
  PersonalBill,
  SplitConfig,
  SplitType,
} from '@/shared/types/bonton';

export type StringRecordKey = 'payerAmounts' | 'personalAmounts' | 'percentages' | 'customAmounts';

export interface ExpenseFormState {
  title: string;
  /** Total bill, including personal bills. */
  amount: string;
  multiplePayers: boolean;
  /** The single payer when `multiplePayers` is off. */
  payerId: MemberId;
  payerAmounts: Record<MemberId, string>;
  personalOpen: boolean;
  personalAmounts: Record<MemberId, string>;
  splitType: SplitType;
  /** Equal split: who shares the (non-personal) amount. */
  participants: Record<MemberId, boolean>;
  percentages: Record<MemberId, string>;
  customAmounts: Record<MemberId, string>;
}

export interface FormAnalysis {
  input: ExpenseInput;
  amount: Cents;
  payersTotal: Cents;
  personalTotal: Cents;
  /** Amount left for the shared split. Negative when personal bills exceed the total. */
  shared: Cents;
  percentTotalBps: number;
  customTotal: Cents;
  /** Per-member share of the bill, or the first problem found. */
  result: Result<Record<MemberId, Cents>>;
}

const sum = (values: readonly number[]): number => values.reduce((a, b) => a + b, 0);

function recordOf<T>(members: readonly Member[], value: (member: Member) => T): Record<MemberId, T> {
  const record: Record<MemberId, T> = {};
  for (const member of members) record[member.id] = value(member);
  return record;
}

const parse = (text: string | undefined): Cents => parseMinorUnits(text ?? '') ?? 0;

/** 100 % split evenly, remainder to the first members (33.34 / 33.33 / 33.33). */
export function equalPercentages(members: readonly Member[]): Record<MemberId, string> {
  if (members.length === 0) return {};
  const bps = normalizeBps(members.map(() => 1));
  return recordOf(members, (member) => minorToInputString(bps[members.indexOf(member)] ?? 0));
}

export function createInitialForm(members: readonly Member[], expense?: Expense): ExpenseFormState {
  const me = members.find((m) => m.isMe) ?? members[0];
  const base: ExpenseFormState = {
    title: '',
    amount: '',
    multiplePayers: false,
    payerId: me?.id ?? '',
    payerAmounts: recordOf(members, () => ''),
    personalOpen: false,
    personalAmounts: recordOf(members, () => ''),
    splitType: 'equal',
    participants: recordOf(members, () => true),
    percentages: equalPercentages(members),
    customAmounts: recordOf(members, () => ''),
  };
  if (!expense) return base;

  const known = new Set(members.map((m) => m.id));
  const form: ExpenseFormState = {
    ...base,
    title: expense.title,
    amount: minorToInputString(expense.amount),
  };

  const [firstPayer] = expense.payers;
  if (expense.payers.length === 1 && firstPayer && known.has(firstPayer.memberId)) {
    form.payerId = firstPayer.memberId;
  } else if (expense.payers.length > 0) {
    form.multiplePayers = true;
    form.payerAmounts = recordOf(members, (m) => {
      const paid = expense.payers.find((p) => p.memberId === m.id);
      return paid ? minorToInputString(paid.amount) : '';
    });
  }

  if (expense.personalBills.length > 0) {
    form.personalOpen = true;
    form.personalAmounts = recordOf(members, (m) => {
      const bill = expense.personalBills.find((b) => b.memberId === m.id);
      return bill ? minorToInputString(bill.amount) : '';
    });
  }

  const split = expense.split;
  form.splitType = split.type;
  switch (split.type) {
    case 'equal':
      form.participants = recordOf(members, (m) => split.participantIds.includes(m.id));
      break;
    case 'percentage':
      form.percentages = recordOf(members, (m) => {
        const entry = split.entries.find((e) => e.memberId === m.id);
        return entry ? minorToInputString(entry.bps) : '';
      });
      break;
    case 'custom':
      form.customAmounts = recordOf(members, (m) => {
        const entry = split.entries.find((e) => e.memberId === m.id);
        return entry ? minorToInputString(entry.amount) : '';
      });
      break;
  }
  return form;
}

/** Immutable update of one member's text in one of the per-member records. */
export function setMemberText(
  form: ExpenseFormState,
  key: StringRecordKey,
  memberId: MemberId,
  value: string,
): ExpenseFormState {
  switch (key) {
    case 'payerAmounts':
      return { ...form, payerAmounts: { ...form.payerAmounts, [memberId]: value } };
    case 'personalAmounts':
      return { ...form, personalAmounts: { ...form.personalAmounts, [memberId]: value } };
    case 'percentages':
      return { ...form, percentages: { ...form.percentages, [memberId]: value } };
    case 'customAmounts':
      return { ...form, customAmounts: { ...form.customAmounts, [memberId]: value } };
  }
}

export function toggleParticipant(form: ExpenseFormState, memberId: MemberId): ExpenseFormState {
  return { ...form, participants: { ...form.participants, [memberId]: !form.participants[memberId] } };
}

export function analyzeForm(form: ExpenseFormState, members: readonly Member[]): FormAnalysis {
  const amount = parse(form.amount);

  const payers: PayerShare[] = form.multiplePayers
    ? members.flatMap((m) => {
        const paid = parse(form.payerAmounts[m.id]);
        return paid > 0 ? [{ memberId: m.id, amount: paid }] : [];
      })
    : [{ memberId: form.payerId, amount }];

  const personalBills: PersonalBill[] = form.personalOpen
    ? members.flatMap((m) => {
        const bill = parse(form.personalAmounts[m.id]);
        return bill > 0 ? [{ memberId: m.id, amount: bill }] : [];
      })
    : [];

  const percentEntries = members.flatMap((m) => {
    const bps = parse(form.percentages[m.id]);
    return bps > 0 ? [{ memberId: m.id, bps }] : [];
  });
  const customEntries = members.flatMap((m) => {
    const value = parse(form.customAmounts[m.id]);
    return value > 0 ? [{ memberId: m.id, amount: value }] : [];
  });

  let split: SplitConfig;
  switch (form.splitType) {
    case 'equal':
      split = { type: 'equal', participantIds: members.filter((m) => form.participants[m.id]).map((m) => m.id) };
      break;
    case 'percentage':
      split = { type: 'percentage', entries: percentEntries };
      break;
    case 'custom':
      split = { type: 'custom', entries: customEntries };
      break;
  }

  const personalTotal = sum(personalBills.map((b) => b.amount));
  const input: ExpenseInput = { title: form.title.trim(), amount, payers, personalBills, split };

  return {
    input,
    amount,
    payersTotal: sum(payers.map((p) => p.amount)),
    personalTotal,
    shared: amount - personalTotal,
    percentTotalBps: sum(percentEntries.map((e) => e.bps)),
    customTotal: sum(customEntries.map((e) => e.amount)),
    result: computeShares(input),
  };
}

/**
 * Switch the split type, prefilling the new mode with a sensible starting point
 * (100 % shared equally, or the shared amount divided equally) when it is still empty.
 */
export function switchSplitType(
  form: ExpenseFormState,
  members: readonly Member[],
  next: SplitType,
): ExpenseFormState {
  if (next === form.splitType) return form;
  const updated: ExpenseFormState = { ...form, splitType: next };

  if (next === 'percentage' && members.every((m) => parse(form.percentages[m.id]) === 0)) {
    updated.percentages = equalPercentages(members);
  }

  if (next === 'custom' && members.every((m) => parse(form.customAmounts[m.id]) === 0)) {
    const shared = analyzeForm(form, members).shared;
    const chosen = members.filter((m) => form.participants[m.id]);
    const targets = chosen.length > 0 ? chosen : [...members];
    if (shared > 0 && targets.length > 0) {
      const parts = splitEqually(shared, targets.length);
      updated.customAmounts = recordOf(members, (m) => {
        const index = targets.findIndex((t) => t.id === m.id);
        return index === -1 ? '' : minorToInputString(parts[index] ?? 0);
      });
    }
  }
  return updated;
}
