import { describe, expect, test } from 'bun:test';

import type { Cents, ExpenseCore, MemberId, SplitConfig, Transfer } from '../types/bonton';
import {
  allocateProportionally,
  computeNetBalances,
  computeShares,
  minimizeTransfers,
  normalizeBps,
  rebalanceExpenseAfterRemoval,
  splitEqually,
} from './settlement';
import {
  formatBps,
  formatMoney,
  localizeDigits,
  minorToInputString,
  parseMinorUnits,
  sanitizeDecimalInput,
  toAsciiDigits,
  toBengaliDigits,
} from './money';

const sum = (values: readonly number[]) => values.reduce((a, b) => a + b, 0);

function shares(core: ExpenseCore): Record<MemberId, Cents> {
  const result = computeShares(core);
  if (!result.ok) throw new Error(`unexpected issue: ${result.issue.code}`);
  return result.value;
}

/** Small deterministic PRNG (mulberry32) so failures are reproducible. */
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('allocation primitives', () => {
  test('equal split gives the remainder cents to the first members', () => {
    expect(splitEqually(100, 3)).toEqual([34, 33, 33]);
    expect(splitEqually(1, 3)).toEqual([1, 0, 0]);
    expect(splitEqually(0, 3)).toEqual([0, 0, 0]);
    expect(splitEqually(10, 4)).toEqual([3, 3, 2, 2]);
    expect(splitEqually(100, 1)).toEqual([100]);
  });

  test('allocation always sums to the total and never uses floats', () => {
    const rand = rng(7);
    for (let i = 0; i < 500; i += 1) {
      const total = Math.floor(rand() * 10_000_000);
      const weights = Array.from({ length: 1 + Math.floor(rand() * 8) }, () => Math.floor(rand() * 5000));
      if (sum(weights) === 0) continue;
      const parts = allocateProportionally(total, weights);
      expect(sum(parts)).toBe(total);
      expect(parts.every((p) => Number.isInteger(p) && p >= 0)).toBe(true);
    }
  });

  test('handles huge amounts without overflow (BigInt path)', () => {
    const total = 999_999_999_999;
    const parts = allocateProportionally(total, [999_999_999_999, 999_999_999_998, 1]);
    expect(sum(parts)).toBe(total);
  });

  test('normalizeBps scales any weights to exactly 100 %', () => {
    expect(normalizeBps([1, 1, 1])).toEqual([3334, 3333, 3333]);
    expect(normalizeBps([5000, 3000])).toEqual([6250, 3750]);
    expect(sum(normalizeBps([3333, 3333, 3333]))).toBe(10_000);
    expect(normalizeBps([0, 0])).toEqual([0, 0]);
  });

  test('rejects invalid input instead of silently returning garbage', () => {
    expect(() => allocateProportionally(-1, [1])).toThrow(RangeError);
    expect(() => allocateProportionally(1.5, [1])).toThrow(RangeError);
    expect(() => allocateProportionally(10, [0, 0])).toThrow(RangeError);
    expect(() => allocateProportionally(10, [])).toThrow(RangeError);
  });
});

describe('computeShares', () => {
  const equalAll: SplitConfig = { type: 'equal', participantIds: ['a', 'b', 'c'] };

  test('equal split with remainder', () => {
    const s = shares({ amount: 10_000, payers: [{ memberId: 'a', amount: 10_000 }], personalBills: [], split: equalAll });
    expect(s).toEqual({ a: 3334, b: 3333, c: 3333 });
  });

  test('percentage split normalizes to 100 % (150 % total)', () => {
    const s = shares({
      amount: 30_000,
      payers: [{ memberId: 'a', amount: 30_000 }],
      personalBills: [],
      split: {
        type: 'percentage',
        entries: [
          { memberId: 'a', bps: 10_000 }, // 100
          { memberId: 'b', bps: 5_000 }, // 50  → 150 total
        ],
      },
    });
    expect(s).toEqual({ a: 20_000, b: 10_000 });
  });

  test('percentage split with exact 100 %', () => {
    const s = shares({
      amount: 10_000,
      payers: [{ memberId: 'a', amount: 10_000 }],
      personalBills: [],
      split: {
        type: 'percentage',
        entries: [
          { memberId: 'a', bps: 7_000 },
          { memberId: 'b', bps: 3_000 },
        ],
      },
    });
    expect(s).toEqual({ a: 7_000, b: 3_000 });
  });

  test('custom fixed split must match the shared amount', () => {
    const base = {
      amount: 10_000,
      payers: [{ memberId: 'a', amount: 10_000 }],
      personalBills: [],
    };
    const good = shares({
      ...base,
      split: { type: 'custom', entries: [{ memberId: 'a', amount: 6_000 }, { memberId: 'b', amount: 4_000 }] },
    });
    expect(good).toEqual({ a: 6_000, b: 4_000 });

    const bad = computeShares({
      ...base,
      split: { type: 'custom', entries: [{ memberId: 'a', amount: 6_000 }, { memberId: 'b', amount: 3_000 }] },
    });
    expect(bad).toEqual({ ok: false, issue: { code: 'custom_mismatch', diff: 1_000 } });
  });

  test('personal bills are deducted before the shared split', () => {
    // 1000.00 bill: A has 200.00 personal, B 100.00 personal, 700.00 shared by three.
    const s = shares({
      amount: 100_000,
      payers: [{ memberId: 'a', amount: 100_000 }],
      personalBills: [
        { memberId: 'a', amount: 20_000 },
        { memberId: 'b', amount: 10_000 },
      ],
      split: equalAll,
    });
    expect(s).toEqual({ a: 20_000 + 23_334, b: 10_000 + 23_333, c: 23_333 });
    expect(sum(Object.values(s))).toBe(100_000);
  });

  test('personal bill for someone outside the shared split is allowed', () => {
    const s = shares({
      amount: 10_000,
      payers: [{ memberId: 'a', amount: 10_000 }],
      personalBills: [{ memberId: 'd', amount: 4_000 }],
      split: { type: 'equal', participantIds: ['a', 'b'] },
    });
    expect(s).toEqual({ d: 4_000, a: 3_000, b: 3_000 });
  });

  test('everything personal needs no participants', () => {
    const s = shares({
      amount: 10_000,
      payers: [{ memberId: 'a', amount: 10_000 }],
      personalBills: [{ memberId: 'a', amount: 6_000 }, { memberId: 'b', amount: 4_000 }],
      split: { type: 'equal', participantIds: [] },
    });
    expect(s).toEqual({ a: 6_000, b: 4_000 });
  });

  test('reports precise issues', () => {
    const core = (over: Partial<ExpenseCore>): ExpenseCore => ({
      amount: 10_000,
      payers: [{ memberId: 'a', amount: 10_000 }],
      personalBills: [],
      split: equalAll,
      ...over,
    });
    const issue = (c: ExpenseCore) => {
      const r = computeShares(c);
      return r.ok ? null : r.issue;
    };
    expect(issue(core({ amount: 0 }))).toEqual({ code: 'invalid_amount', diff: 0 });
    expect(issue(core({ amount: 10.5 }))).toEqual({ code: 'invalid_amount', diff: 0 });
    expect(issue(core({ payers: [{ memberId: 'a', amount: 4_000 }] }))).toEqual({ code: 'payers_mismatch', diff: 6_000 });
    expect(issue(core({ payers: [{ memberId: 'a', amount: 9_000 }, { memberId: 'a', amount: 1_000 }] }))?.code).toBe('duplicate_member');
    expect(issue(core({ personalBills: [{ memberId: 'a', amount: 12_000 }] }))).toEqual({ code: 'personal_exceeds_total', diff: 2_000 });
    expect(issue(core({ split: { type: 'equal', participantIds: [] } }))?.code).toBe('no_participants');
    expect(issue(core({ split: { type: 'percentage', entries: [{ memberId: 'a', bps: 0 }] } }))?.code).toBe('no_weight');
  });
});

describe('balances and debt minimization', () => {
  test('multiple payers produce correct net balances', () => {
    const net = computeNetBalances(['a', 'b', 'c'], [
      {
        amount: 90_000,
        payers: [{ memberId: 'a', amount: 60_000 }, { memberId: 'b', amount: 30_000 }],
        personalBills: [],
        split: { type: 'equal', participantIds: ['a', 'b', 'c'] },
      },
    ]);
    expect(net).toEqual({ a: 30_000, b: 0, c: -30_000 });
  });

  test('greedy minimization settles everyone with few transfers', () => {
    const transfers = minimizeTransfers({ a: -5_000, b: -3_000, c: 8_000 });
    expect(transfers).toHaveLength(2);
    expect(transfers).toContainEqual({ from: 'a', to: 'c', amount: 5_000 });
    expect(transfers).toContainEqual({ from: 'b', to: 'c', amount: 3_000 });
  });

  test('exact matches are paired first', () => {
    const transfers = minimizeTransfers({ a: -5_000, b: -2_000, c: 5_000, d: 2_000 });
    expect(transfers).toHaveLength(2);
    expect(transfers).toContainEqual({ from: 'a', to: 'c', amount: 5_000 });
    expect(transfers).toContainEqual({ from: 'b', to: 'd', amount: 2_000 });
  });

  test('no transfers when settled', () => {
    expect(minimizeTransfers({ a: 0, b: 0 })).toEqual([]);
  });
});

/** Applying the transfers must bring every balance to exactly zero. */
function applyTransfers(balances: Record<MemberId, Cents>, transfers: Transfer[]) {
  const result = { ...balances };
  for (const t of transfers) {
    result[t.from] = (result[t.from] ?? 0) + t.amount;
    result[t.to] = (result[t.to] ?? 0) - t.amount;
  }
  return result;
}

describe('randomized invariants', () => {
  const ids = ['m0', 'm1', 'm2', 'm3', 'm4', 'm5'];

  function randomExpense(rand: () => number): ExpenseCore {
    const members = ids.slice(0, 2 + Math.floor(rand() * 5));
    const amount = 1 + Math.floor(rand() * 5_000_000);

    // 1–3 payers
    const payerIds = members.slice(0, 1 + Math.floor(rand() * Math.min(3, members.length)));
    const payerAmounts = allocateProportionally(amount, payerIds.map(() => 1 + Math.floor(rand() * 100)));
    const payers = payerIds.map((memberId, i) => ({ memberId, amount: payerAmounts[i] ?? 0 }));

    // personal bills for a random subset, never exceeding the bill
    let remaining = Math.floor(amount * rand() * 0.6);
    const personalBills = members.flatMap((memberId) => {
      if (rand() < 0.5 || remaining === 0) return [];
      const part = Math.floor(rand() * remaining);
      remaining -= part;
      return part > 0 ? [{ memberId, amount: part }] : [];
    });
    const shared = amount - sum(personalBills.map((b) => b.amount));

    const kind = Math.floor(rand() * 3);
    let split: SplitConfig;
    if (kind === 0) {
      split = { type: 'equal', participantIds: members };
    } else if (kind === 1) {
      split = {
        type: 'percentage',
        entries: members.map((memberId) => ({ memberId, bps: 1 + Math.floor(rand() * 9_000) })),
      };
    } else {
      const parts = allocateProportionally(shared, members.map(() => 1 + Math.floor(rand() * 50)));
      split = { type: 'custom', entries: members.map((memberId, i) => ({ memberId, amount: parts[i] ?? 0 })) };
    }
    return { amount, payers, personalBills, split };
  }

  test('shares sum to the bill; balances sum to zero; transfers settle everything', () => {
    const rand = rng(2026);
    for (let run = 0; run < 400; run += 1) {
      const expenses = Array.from({ length: 1 + Math.floor(rand() * 6) }, () => randomExpense(rand));

      for (const e of expenses) {
        expect(sum(Object.values(shares(e)))).toBe(e.amount);
      }

      const net = computeNetBalances(ids, expenses);
      expect(sum(Object.values(net))).toBe(0);

      const transfers = minimizeTransfers(net);
      const nonZero = Object.values(net).filter((b) => b !== 0).length;
      expect(transfers.length).toBeLessThanOrEqual(Math.max(0, nonZero - 1));
      expect(transfers.every((t) => t.amount > 0 && t.from !== t.to)).toBe(true);
      expect(Object.values(applyTransfers(net, transfers)).every((b) => b === 0)).toBe(true);
    }
  });

  test('removing a member keeps every expense valid and the ledger balanced', () => {
    const rand = rng(99);
    for (let run = 0; run < 400; run += 1) {
      const expenses = Array.from({ length: 1 + Math.floor(rand() * 5) }, () => randomExpense(rand));
      const removed = ids[Math.floor(rand() * ids.length)] as MemberId;

      const rebalanced = expenses
        .map((e) => rebalanceExpenseAfterRemoval(e, removed))
        .filter((e): e is ExpenseCore => e !== null);

      for (const e of rebalanced) {
        const s = computeShares(e);
        expect(s.ok).toBe(true);
        expect(sum(e.payers.map((p) => p.amount))).toBe(e.amount);
        expect(e.payers.some((p) => p.memberId === removed)).toBe(false);
        expect(e.personalBills.some((b) => b.memberId === removed)).toBe(false);
        if (s.ok) {
          expect(removed in s.value).toBe(false);
          expect(sum(Object.values(s.value))).toBe(e.amount);
        }
      }
      const net = computeNetBalances(ids.filter((id) => id !== removed), rebalanced);
      expect(sum(Object.values(net))).toBe(0);
    }
  });
});

describe('member removal rebalancing', () => {
  test('equal split is re-split among the remaining members', () => {
    const result = rebalanceExpenseAfterRemoval(
      {
        amount: 10_000,
        payers: [{ memberId: 'a', amount: 10_000 }],
        personalBills: [],
        split: { type: 'equal', participantIds: ['a', 'b', 'c'] },
      },
      'c',
    );
    expect(result).not.toBeNull();
    expect(shares(result as ExpenseCore)).toEqual({ a: 5_000, b: 5_000 });
  });

  test('percentages are renormalized to 100 %', () => {
    const result = rebalanceExpenseAfterRemoval(
      {
        amount: 10_000,
        payers: [{ memberId: 'a', amount: 10_000 }],
        personalBills: [],
        split: {
          type: 'percentage',
          entries: [
            { memberId: 'a', bps: 5_000 },
            { memberId: 'b', bps: 3_000 },
            { memberId: 'c', bps: 2_000 },
          ],
        },
      },
      'c',
    ) as ExpenseCore;
    expect(result.split).toEqual({
      type: 'percentage',
      entries: [
        { memberId: 'a', bps: 6_250 },
        { memberId: 'b', bps: 3_750 },
      ],
    });
  });

  test("custom split spreads the leaver's amount proportionally", () => {
    const result = rebalanceExpenseAfterRemoval(
      {
        amount: 10_000,
        payers: [{ memberId: 'a', amount: 10_000 }],
        personalBills: [],
        split: {
          type: 'custom',
          entries: [
            { memberId: 'a', amount: 5_000 },
            { memberId: 'b', amount: 3_000 },
            { memberId: 'c', amount: 2_000 },
          ],
        },
      },
      'c',
    ) as ExpenseCore;
    expect(shares(result)).toEqual({ a: 6_250, b: 3_750 });
  });

  test("the leaver's payments and personal bills are dropped", () => {
    const result = rebalanceExpenseAfterRemoval(
      {
        amount: 10_000,
        payers: [{ memberId: 'a', amount: 6_000 }, { memberId: 'c', amount: 4_000 }],
        personalBills: [{ memberId: 'c', amount: 1_000 }, { memberId: 'b', amount: 500 }],
        split: { type: 'equal', participantIds: ['a', 'b', 'c'] },
      },
      'c',
    ) as ExpenseCore;
    expect(result.amount).toBe(6_000);
    expect(result.payers).toEqual([{ memberId: 'a', amount: 6_000 }]);
    expect(shares(result)).toEqual({ b: 500 + 2_750, a: 2_750 });
  });

  test('expense disappears when the only payer leaves', () => {
    expect(
      rebalanceExpenseAfterRemoval(
        {
          amount: 10_000,
          payers: [{ memberId: 'c', amount: 10_000 }],
          personalBills: [],
          split: { type: 'equal', participantIds: ['a', 'b', 'c'] },
        },
        'c',
      ),
    ).toBeNull();
  });

  test('expense disappears when nobody remains to share it', () => {
    expect(
      rebalanceExpenseAfterRemoval(
        {
          amount: 10_000,
          payers: [{ memberId: 'a', amount: 10_000 }],
          personalBills: [],
          split: { type: 'equal', participantIds: ['c'] },
        },
        'c',
      ),
    ).toBeNull();
  });
});

describe('money formatting and parsing', () => {
  test('parses text into integer minor units without floats', () => {
    expect(parseMinorUnits('120.5')).toBe(12_050);
    expect(parseMinorUnits('0.1')).toBe(10);
    expect(parseMinorUnits('0.29')).toBe(29); // 0.29 * 100 === 28.999… in floats
    expect(parseMinorUnits('19.99')).toBe(1_999);
    expect(parseMinorUnits('.5')).toBe(50);
    expect(parseMinorUnits('12.')).toBe(1_200);
    expect(parseMinorUnits('')).toBeNull();
    expect(parseMinorUnits('.')).toBeNull();
    expect(parseMinorUnits('১২০.৫')).toBe(12_050); // Bengali digits
  });

  test('sanitizes decimal input', () => {
    expect(sanitizeDecimalInput('12.345')).toBe('12.34');
    expect(sanitizeDecimalInput('1,2a3..4')).toBe('1.23');
    expect(toAsciiDigits('৳১২৩')).toBe('৳123');
  });

  test('round-trips minor units through input strings', () => {
    for (const minor of [0, 5, 10, 99, 100, 12_050, 99_999_99]) {
      expect(parseMinorUnits(minorToInputString(minor))).toBe(minor);
    }
  });

  test('formats currencies with the right grouping and numerals', () => {
    expect(formatMoney(123_456_700, 'BDT', 'en')).toBe('৳12,34,567');
    expect(formatMoney(123_456_700, 'USD', 'en')).toBe('$1,234,567');
    expect(formatMoney(12_050, 'GBP', 'en')).toBe('£120.50');
    expect(formatMoney(120_000, 'BDT', 'bn')).toBe('৳১,২০০');
    expect(formatMoney(-5_000, 'EUR', 'en')).toBe('-€50');
    expect(formatBps(3_333, 'en')).toBe('33.33');
    expect(formatBps(5_000, 'bn')).toBe('৫০');
    expect(toBengaliDigits(688)).toBe('৬৮৮');
    expect(toBengaliDigits('154')).toBe('১৫৪');
    expect(localizeDigits('2 Person', 'bn')).toBe('২ Person');
    expect(localizeDigits(0, 'bn')).toBe('০');
    expect(localizeDigits(688, 'en')).toBe('688');
  });
});
