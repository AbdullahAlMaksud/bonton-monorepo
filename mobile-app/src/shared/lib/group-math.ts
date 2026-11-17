/**
 * Group-level derived data. Pure functions over the domain model; the Zustand
 * store getters and the React selectors both delegate here.
 */
import type {
  Cents,
  DashboardSummary,
  Group,
  GroupSummary,
  Member,
  MemberBalance,
  Transfer,
} from '../types/bonton';
import { computeNetBalances, minimizeTransfers } from './settlement';

export function findMe(group: Group): Member | undefined {
  return group.members.find((m) => m.isMe);
}

export function computeGroupBalances(group: Group): MemberBalance[] {
  const net = computeNetBalances(
    group.members.map((m) => m.id),
    group.expenses,
  );
  return group.members.map((m) => ({ memberId: m.id, balance: net[m.id] ?? 0 }));
}

export function computeGroupSettlements(group: Group): Transfer[] {
  const net = computeNetBalances(
    group.members.map((m) => m.id),
    group.expenses,
  );
  return minimizeTransfers(net);
}

export function computeGroupTotal(group: Group): Cents {
  return group.expenses.reduce((total, e) => total + e.amount, 0);
}

export function computeGroupSummary(group: Group): GroupSummary {
  const me = findMe(group);
  const balances = computeGroupBalances(group);
  const mine = me ? balances.find((b) => b.memberId === me.id) : undefined;
  return {
    groupId: group.id,
    myBalance: mine?.balance ?? 0,
    totalSpent: computeGroupTotal(group),
  };
}

export function computeDashboardSummary(groups: readonly Group[]): DashboardSummary {
  const summaries = groups.map(computeGroupSummary);
  let totalOwedToMe = 0;
  let totalIOwe = 0;
  for (const s of summaries) {
    if (s.myBalance > 0) totalOwedToMe += s.myBalance;
    else if (s.myBalance < 0) totalIOwe += -s.myBalance;
  }
  return { totalOwedToMe, totalIOwe, net: totalOwedToMe - totalIOwe, groups: summaries };
}
