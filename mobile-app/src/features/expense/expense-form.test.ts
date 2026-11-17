import { describe, expect, test } from 'bun:test';

import type { Expense, Member } from '@/shared/types/bonton';

import {
  analyzeForm,
  createInitialForm,
  equalPercentages,
  setMemberText,
  switchSplitType,
  toggleParticipant,
} from './expense-form';

const members: Member[] = [
  { id: 'me', name: '', isMe: true },
  { id: 'a', name: 'Rakib', isMe: false },
  { id: 'b', name: 'Nila', isMe: false },
];

function shares(result: ReturnType<typeof analyzeForm>['result']) {
  if (!result.ok) throw new Error(`unexpected issue ${result.issue.code}`);
  return result.value;
}

describe('expense form', () => {
  test('a fresh form defaults to "me" paying, equal split among everyone, 100 % shared evenly', () => {
    const form = createInitialForm(members);
    expect(form.payerId).toBe('me');
    expect(form.splitType).toBe('equal');
    expect(form.participants).toEqual({ me: true, a: true, b: true });
    expect(form.percentages).toEqual({ me: '33.34', a: '33.33', b: '33.33' });
    expect(equalPercentages([])).toEqual({});
  });

  test('typed text becomes integer minor units and an equal split', () => {
    let form = createInitialForm(members);
    form = { ...form, title: ' Dinner ', amount: '100' };
    const analysis = analyzeForm(form, members);
    expect(analysis.input.title).toBe('Dinner');
    expect(analysis.amount).toBe(10_000);
    expect(shares(analysis.result)).toEqual({ me: 3334, a: 3333, b: 3333 });
  });

  test('personal bills are deducted first; a closed section is ignored', () => {
    let form = createInitialForm(members);
    form = { ...form, amount: '1000', personalOpen: true };
    form = setMemberText(form, 'personalAmounts', 'me', '200');
    form = setMemberText(form, 'personalAmounts', 'a', '100');

    const open = analyzeForm(form, members);
    expect(open.personalTotal).toBe(30_000);
    expect(open.shared).toBe(70_000);
    expect(shares(open.result)).toEqual({ me: 20_000 + 23_334, a: 10_000 + 23_333, b: 23_333 });

    const closed = analyzeForm({ ...form, personalOpen: false }, members);
    expect(closed.personalTotal).toBe(0);
    expect(shares(closed.result)).toEqual({ me: 33_334, a: 33_333, b: 33_333 });
  });

  test('multiple payers must add up to the total', () => {
    let form = createInitialForm(members);
    form = { ...form, amount: '90', multiplePayers: true };
    form = setMemberText(form, 'payerAmounts', 'me', '60');

    const short = analyzeForm(form, members);
    expect(short.payersTotal).toBe(6_000);
    expect(short.result).toEqual({ ok: false, issue: { code: 'payers_mismatch', diff: 3_000 } });

    form = setMemberText(form, 'payerAmounts', 'a', '30');
    expect(analyzeForm(form, members).result.ok).toBe(true);
  });

  test('percentages that do not add to 100 are scaled proportionally', () => {
    let form = createInitialForm(members);
    form = { ...form, amount: '300', splitType: 'percentage' };
    form = setMemberText(form, 'percentages', 'me', '100');
    form = setMemberText(form, 'percentages', 'a', '50');
    form = setMemberText(form, 'percentages', 'b', '');

    const analysis = analyzeForm(form, members);
    expect(analysis.percentTotalBps).toBe(15_000);
    expect(shares(analysis.result)).toEqual({ me: 20_000, a: 10_000 });
  });

  test('switching to custom prefills an equal split of the shared amount', () => {
    let form = createInitialForm(members);
    form = { ...form, amount: '100' };
    form = toggleParticipant(form, 'b'); // b is out
    const custom = switchSplitType(form, members, 'custom');
    expect(custom.customAmounts).toEqual({ me: '50', a: '50', b: '' });
    expect(analyzeForm(custom, members).result.ok).toBe(true);

    // Already-typed custom values are not overwritten when switching back and forth.
    const edited = setMemberText(custom, 'customAmounts', 'me', '70');
    const roundTrip = switchSplitType(switchSplitType(edited, members, 'equal'), members, 'custom');
    expect(roundTrip.customAmounts.me).toBe('70');
  });

  test('custom amounts that miss the shared amount report how much is left', () => {
    let form = createInitialForm(members);
    form = { ...form, amount: '100', splitType: 'custom' };
    form = setMemberText(form, 'customAmounts', 'me', '40');
    expect(analyzeForm(form, members).result).toEqual({
      ok: false,
      issue: { code: 'custom_mismatch', diff: 6_000 },
    });
  });

  test('an existing expense round-trips through the form', () => {
    const expense: Expense = {
      id: 'e1',
      title: 'Hotel',
      amount: 120_050,
      payers: [
        { memberId: 'me', amount: 100_000 },
        { memberId: 'a', amount: 20_050 },
      ],
      personalBills: [{ memberId: 'b', amount: 5_000 }],
      split: {
        type: 'percentage',
        entries: [
          { memberId: 'me', bps: 6_000 },
          { memberId: 'a', bps: 4_000 },
        ],
      },
      createdAt: 1,
      updatedAt: 1,
    };

    const form = createInitialForm(members, expense);
    expect(form.multiplePayers).toBe(true);
    expect(form.personalOpen).toBe(true);
    expect(form.splitType).toBe('percentage');
    expect(form.amount).toBe('1200.5');

    const analysis = analyzeForm(form, members);
    expect(analysis.input).toEqual({
      title: 'Hotel',
      amount: 120_050,
      payers: expense.payers,
      personalBills: expense.personalBills,
      split: expense.split,
    });
    expect(analysis.result.ok).toBe(true);
  });

  test('an empty amount is an invalid_amount issue, not a crash', () => {
    const analysis = analyzeForm(createInitialForm(members), members);
    expect(analysis.result).toEqual({ ok: false, issue: { code: 'invalid_amount', diff: 0 } });
  });
});
