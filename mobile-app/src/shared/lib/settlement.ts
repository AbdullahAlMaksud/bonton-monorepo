/**
 * Bonton calculation engine — pure TypeScript, no React Native imports.
 *
 * Guarantees
 *  - All money is integer minor units. Allocation uses BigInt, so there is no
 *    floating point error and no intermediate overflow.
 *  - Every allocation is exact: the parts always sum to the total.
 *  - Equal splits give the remainder cents to the FIRST members.
 *  - Output is deterministic (stable tie-breaking by input order).
 */
import type {
  Cents,
  ExpenseCore,
  MemberId,
  SplitConfig,
  Transfer,
} from '../types/bonton';

export const BPS_TOTAL = 10_000;
/** Upper bound for any single amount (1e12 minor units = 10 billion major units). */
export const MAX_AMOUNT: Cents = 1_000_000_000_000;

/* -------------------------------------------------------------------------- */
/* Result / issue types                                                        */
/* -------------------------------------------------------------------------- */

export type SplitIssueCode =
  | 'invalid_amount'
  | 'duplicate_member'
  | 'payers_mismatch'
  | 'personal_exceeds_total'
  | 'no_participants'
  | 'no_weight'
  | 'custom_mismatch';

export interface SplitIssue {
  code: SplitIssueCode;
  /**
   * Context for the UI, in minor units:
   *  - payers_mismatch: amount − Σpayers (positive = still unassigned)
   *  - custom_mismatch: shared − Σcustom (positive = still unassigned)
   *  - personal_exceeds_total: Σpersonal − amount
   */
  diff: Cents;
}

export type Result<T> = { ok: true; value: T } | { ok: false; issue: SplitIssue };

const ok = <T>(value: T): Result<T> => ({ ok: true, value });
const fail = (code: SplitIssueCode, diff: Cents = 0): { ok: false; issue: SplitIssue } => ({
  ok: false,
  issue: { code, diff },
});

/* -------------------------------------------------------------------------- */
/* Primitives                                                                  */
/* -------------------------------------------------------------------------- */

const isMinor = (n: number): boolean => Number.isSafeInteger(n) && n >= 0 && n <= MAX_AMOUNT;

const sum = (values: readonly number[]): number => values.reduce((a, b) => a + b, 0);

const hasUniqueIds = (ids: readonly MemberId[]): boolean => new Set(ids).size === ids.length;

/**
 * Largest-remainder allocation of `total` across `weights`.
 * Σ result === total. Remainder units go to the largest fractional parts;
 * ties go to the earliest index (so equal weights → first members get the extra cent).
 */
export function allocateProportionally(total: Cents, weights: readonly number[]): Cents[] {
  if (!isMinor(total)) throw new RangeError('total must be a non-negative integer amount');
  if (weights.length === 0) throw new RangeError('weights must not be empty');

  let weightSum = 0n;
  const big = weights.map((w) => {
    if (!Number.isSafeInteger(w) || w < 0) {
      throw new RangeError('weights must be non-negative integers');
    }
    const b = BigInt(w);
    weightSum += b;
    return b;
  });
  if (weightSum === 0n) throw new RangeError('weights must not all be zero');

  const t = BigInt(total);
  const remainders: bigint[] = [];
  const parts: number[] = [];
  let allocated = 0n;

  for (const w of big) {
    const numerator = t * w;
    const quotient = numerator / weightSum;
    parts.push(Number(quotient));
    remainders.push(numerator - quotient * weightSum);
    allocated += quotient;
  }

  const leftover = Number(t - allocated);
  const order = remainders
    .map((remainder, index) => ({ remainder, index }))
    .sort((a, b) => {
      if (a.remainder === b.remainder) return a.index - b.index;
      return a.remainder > b.remainder ? -1 : 1;
    });

  for (let k = 0; k < leftover; k += 1) {
    const target = order[k];
    if (target) parts[target.index] = (parts[target.index] ?? 0) + 1;
  }
  return parts;
}

/** Equal split. The remainder (total mod count) goes one unit each to the first members. */
export function splitEqually(total: Cents, count: number): Cents[] {
  if (!Number.isSafeInteger(count) || count < 1) throw new RangeError('count must be >= 1');
  return allocateProportionally(total, new Array<number>(count).fill(1));
}

/**
 * Normalize arbitrary non-negative weights to basis points that sum to exactly 10 000.
 * Returns all zeros when every weight is zero.
 */
export function normalizeBps(weights: readonly number[]): number[] {
  if (weights.length === 0) return [];
  if (sum(weights) === 0) return weights.map(() => 0);
  return allocateProportionally(BPS_TOTAL, weights);
}

/* -------------------------------------------------------------------------- */
/* Expense → per-member shares                                                 */
/* -------------------------------------------------------------------------- */

type Allocation = Array<[MemberId, Cents]>;

/** Amount left for the shared split after personal bills are deducted. */
export function sharedAmountOf(core: Pick<ExpenseCore, 'amount' | 'personalBills'>): Cents {
  return core.amount - sum(core.personalBills.map((b) => b.amount));
}

function allocateShared(shared: Cents, split: SplitConfig): Result<Allocation> {
  switch (split.type) {
    case 'equal': {
      const ids = split.participantIds;
      if (!hasUniqueIds(ids)) return fail('duplicate_member');
      if (shared === 0) return ok(ids.map((id): [MemberId, Cents] => [id, 0]));
      if (ids.length === 0) return fail('no_participants');
      const parts = splitEqually(shared, ids.length);
      return ok(ids.map((id, i): [MemberId, Cents] => [id, parts[i] ?? 0]));
    }

    case 'percentage': {
      const entries = split.entries;
      if (!hasUniqueIds(entries.map((e) => e.memberId))) return fail('duplicate_member');
      if (entries.some((e) => !Number.isSafeInteger(e.bps) || e.bps < 0)) {
        return fail('invalid_amount');
      }
      if (shared === 0) return ok(entries.map((e): [MemberId, Cents] => [e.memberId, 0]));
      if (entries.length === 0) return fail('no_participants');
      const weights = entries.map((e) => e.bps);
      if (sum(weights) === 0) return fail('no_weight');
      // Allocating by the raw weights IS normalization to 100 %, and it is exact:
      // rounding the weights to basis points first would add a second rounding step
      // (e.g. 100 : 50 → 66.67 % : 33.33 % → 200.01 / 99.99 on a 300.00 bill).
      const parts = allocateProportionally(shared, weights);
      return ok(entries.map((e, i): [MemberId, Cents] => [e.memberId, parts[i] ?? 0]));
    }

    case 'custom': {
      const entries = split.entries;
      if (!hasUniqueIds(entries.map((e) => e.memberId))) return fail('duplicate_member');
      if (entries.some((e) => !isMinor(e.amount))) return fail('invalid_amount');
      const total = sum(entries.map((e) => e.amount));
      if (total !== shared) return fail('custom_mismatch', shared - total);
      return ok(entries.map((e): [MemberId, Cents] => [e.memberId, e.amount]));
    }
  }
}

/**
 * How much each member OWES for this expense:
 *   personal bill + their part of (amount − Σ personal bills).
 * Σ shares === amount, always.
 */
export function computeShares(core: ExpenseCore): Result<Record<MemberId, Cents>> {
  const { amount, payers, personalBills, split } = core;

  if (!isMinor(amount) || amount === 0) return fail('invalid_amount');
  if (payers.some((p) => !isMinor(p.amount)) || personalBills.some((b) => !isMinor(b.amount))) {
    return fail('invalid_amount');
  }
  if (
    !hasUniqueIds(payers.map((p) => p.memberId)) ||
    !hasUniqueIds(personalBills.map((b) => b.memberId))
  ) {
    return fail('duplicate_member');
  }

  const paid = sum(payers.map((p) => p.amount));
  if (paid !== amount) return fail('payers_mismatch', amount - paid);

  const personalTotal = sum(personalBills.map((b) => b.amount));
  if (personalTotal > amount) return fail('personal_exceeds_total', personalTotal - amount);

  const allocation = allocateShared(amount - personalTotal, split);
  if (!allocation.ok) return allocation;

  const shares: Record<MemberId, Cents> = {};
  for (const bill of personalBills) {
    shares[bill.memberId] = (shares[bill.memberId] ?? 0) + bill.amount;
  }
  for (const [memberId, part] of allocation.value) {
    shares[memberId] = (shares[memberId] ?? 0) + part;
  }
  return ok(shares);
}

/* -------------------------------------------------------------------------- */
/* Balances and debt minimization                                              */
/* -------------------------------------------------------------------------- */

/**
 * Net balance per member: Σ paid − Σ owed.
 * Positive = is owed money, negative = owes money. Σ balances === 0.
 * Expenses that fail validation are skipped (the store never persists those).
 */
export function computeNetBalances(
  memberIds: readonly MemberId[],
  expenses: readonly ExpenseCore[],
): Record<MemberId, Cents> {
  const net: Record<MemberId, Cents> = {};
  for (const id of memberIds) net[id] = 0;

  for (const expense of expenses) {
    const shares = computeShares(expense);
    if (!shares.ok) continue;
    for (const payer of expense.payers) {
      net[payer.memberId] = (net[payer.memberId] ?? 0) + payer.amount;
    }
    for (const [memberId, owed] of Object.entries(shares.value)) {
      net[memberId] = (net[memberId] ?? 0) - owed;
    }
  }
  return net;
}

interface Node {
  id: MemberId;
  order: number;
  amount: Cents;
}

function pickLargest(nodes: Node[]): Node | undefined {
  let best: Node | undefined;
  for (const node of nodes) {
    if (node.amount <= 0) continue;
    if (!best || node.amount > best.amount || (node.amount === best.amount && node.order < best.order)) {
      best = node;
    }
  }
  return best;
}

/**
 * Greedy debt minimization.
 *  1. Pair debtors and creditors whose amounts match exactly (one transfer each).
 *  2. Repeatedly match the largest debtor with the largest creditor.
 * Produces at most (n − 1) transfers and every transfer settles at least one person.
 */
export function minimizeTransfers(balances: Readonly<Record<MemberId, Cents>>): Transfer[] {
  const creditors: Node[] = [];
  const debtors: Node[] = [];
  Object.entries(balances).forEach(([id, balance], order) => {
    if (balance > 0) creditors.push({ id, order, amount: balance });
    else if (balance < 0) debtors.push({ id, order, amount: -balance });
  });

  const transfers: Transfer[] = [];

  for (const debtor of debtors) {
    const match = creditors.find((c) => c.amount > 0 && c.amount === debtor.amount);
    if (match && debtor.amount > 0) {
      transfers.push({ from: debtor.id, to: match.id, amount: debtor.amount });
      debtor.amount = 0;
      match.amount = 0;
    }
  }

  for (;;) {
    const debtor = pickLargest(debtors);
    const creditor = pickLargest(creditors);
    if (!debtor || !creditor) break;
    const amount = Math.min(debtor.amount, creditor.amount);
    transfers.push({ from: debtor.id, to: creditor.id, amount });
    debtor.amount -= amount;
    creditor.amount -= amount;
  }

  return transfers;
}

/* -------------------------------------------------------------------------- */
/* Member removal                                                              */
/* -------------------------------------------------------------------------- */

function rebalanceSplit(split: SplitConfig, removedId: MemberId, shared: Cents): SplitConfig | null {
  switch (split.type) {
    case 'equal': {
      const participantIds = split.participantIds.filter((id) => id !== removedId);
      if (participantIds.length === 0 && shared > 0) return null;
      return { type: 'equal', participantIds };
    }

    case 'percentage': {
      const entries = split.entries.filter((e) => e.memberId !== removedId);
      if (entries.length === 0) return shared > 0 ? null : { type: 'percentage', entries };
      const weights = entries.map((e) => e.bps);
      // If everyone left had 0 %, fall back to equal weights.
      const normalized = normalizeBps(sum(weights) > 0 ? weights : weights.map(() => 1));
      return {
        type: 'percentage',
        entries: entries.map((e, i) => ({ memberId: e.memberId, bps: normalized[i] ?? 0 })),
      };
    }

    case 'custom': {
      const entries = split.entries.filter((e) => e.memberId !== removedId);
      if (entries.length === 0) return shared > 0 ? null : { type: 'custom', entries };
      const weights = entries.map((e) => e.amount);
      // The removed member's fixed amount is redistributed in proportion to the others'.
      const parts = allocateProportionally(shared, sum(weights) > 0 ? weights : weights.map(() => 1));
      return {
        type: 'custom',
        entries: entries.map((e, i) => ({ memberId: e.memberId, amount: parts[i] ?? 0 })),
      };
    }
  }
}

/**
 * Recompute an expense as if `removedId` had left the group:
 *  - the leaver's payments are dropped, so the bill amount becomes what the
 *    remaining payers actually fronted;
 *  - the leaver's personal bills are dropped;
 *  - the shared amount is re-split among the remaining participants
 *    (equal → equal over n−1, percentage → renormalized to 100 %,
 *    custom → the leaver's fixed amount is spread proportionally).
 *
 * Returns `null` when nothing meaningful is left (nobody paid, or nobody remains
 * to share the cost) — the caller should delete the expense.
 * The result always satisfies Σ payers === amount and passes `computeShares`.
 */
export function rebalanceExpenseAfterRemoval(
  core: ExpenseCore,
  removedId: MemberId,
): ExpenseCore | null {
  const payers = core.payers.filter((p) => p.memberId !== removedId && p.amount > 0);
  const amount = sum(payers.map((p) => p.amount));
  if (amount === 0) return null;

  let personalBills = core.personalBills.filter((b) => b.memberId !== removedId && b.amount > 0);
  if (sum(personalBills.map((b) => b.amount)) > amount) {
    // The bill shrank below the remaining personal items: scale them down to fit.
    const scaled = allocateProportionally(amount, personalBills.map((b) => b.amount));
    personalBills = personalBills
      .map((b, i) => ({ memberId: b.memberId, amount: scaled[i] ?? 0 }))
      .filter((b) => b.amount > 0);
  }

  const shared = amount - sum(personalBills.map((b) => b.amount));
  const split = rebalanceSplit(core.split, removedId, shared);
  if (split === null) return null;

  return { amount, payers, personalBills, split };
}
