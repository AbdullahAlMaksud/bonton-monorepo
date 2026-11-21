import { beforeAll, beforeEach, describe, expect, mock, test } from 'bun:test';

import type { ExpenseInput, Group } from '../types/bonton';

// AsyncStorage is a native module; an in-memory stand-in is enough to exercise persistence wiring.
const disk = new Map<string, string>();
mock.module('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: async (key: string) => disk.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      disk.set(key, value);
    },
    removeItem: async (key: string) => {
      disk.delete(key);
    },
  },
}));

type Store = typeof import('./bonton-store').useBontonStore;
let useStore: Store;

beforeAll(async () => {
  ({ useBontonStore: useStore } = await import('./bonton-store'));
});

beforeEach(() => {
  disk.clear();
  useStore.setState({ groups: [], theme: 'light', language: 'bn', currency: 'BDT' });
});

function setupTrip() {
  const groupId = useStore.getState().createGroup({
    name: 'Cox’s Bazar',
    icon: 'plane',
    memberNames: ['Rakib', ' rakib ', 'Nila', ''],
  });
  const group = useStore.getState().groups.find((g) => g.id === groupId) as Group;
  const [me, rakib, nila] = group.members;
  if (!me || !rakib || !nila) throw new Error('members missing');
  return { groupId, me, rakib, nila };
}

describe('groups and members', () => {
  test('createGroup puts the current user first and drops blank / duplicate names', () => {
    const { groupId, me } = setupTrip();
    const group = useStore.getState().groups.find((g) => g.id === groupId) as Group;
    expect(group.members.map((m) => m.name)).toEqual(['', 'Rakib', 'Nila']);
    expect(me.isMe).toBe(true);
    expect(group.members.filter((m) => m.isMe)).toHaveLength(1);
  });

  test('addMember rejects blanks and case-insensitive duplicates', () => {
    const { groupId } = setupTrip();
    const { addMember } = useStore.getState();
    expect(addMember(groupId, '   ')).toEqual({ ok: false, reason: 'empty' });
    expect(addMember(groupId, 'NILA')).toEqual({ ok: false, reason: 'duplicate' });
    expect(addMember(groupId, 'Sumi').ok).toBe(true);
    expect(addMember('nope', 'X')).toEqual({ ok: false, reason: 'not_found' });
  });

  test('updateMemberName updates member name and rejects empty or duplicate', () => {
    const { groupId, rakib } = setupTrip();
    const { updateMemberName } = useStore.getState();
    expect(updateMemberName(groupId, rakib.id, '  ')).toBe(false);
    expect(updateMemberName(groupId, rakib.id, 'Nila')).toBe(false);
    expect(updateMemberName(groupId, rakib.id, 'Tanvir')).toBe(true);

    const group = useStore.getState().groups.find((g) => g.id === groupId) as Group;
    expect(group.members.find((m) => m.id === rakib.id)?.name).toBe('Tanvir');
  });

  test('updateGroup and deleteGroup', () => {
    const { groupId } = setupTrip();
    useStore.getState().updateGroup(groupId, { name: '  Sylhet  ', icon: 'home' });
    const group = useStore.getState().groups[0] as Group;
    expect(group.name).toBe('Sylhet');
    expect(group.icon).toBe('home');
    useStore.getState().deleteGroup(groupId);
    expect(useStore.getState().groups).toHaveLength(0);
  });
});

describe('expenses', () => {
  test('add / balances / settlements / update / delete', () => {
    const { groupId, me, rakib, nila } = setupTrip();
    const s = useStore.getState();

    const input: ExpenseInput = {
      title: 'Dinner',
      amount: 9_000,
      payers: [{ memberId: me.id, amount: 9_000 }],
      personalBills: [],
      split: { type: 'equal', participantIds: [me.id, rakib.id, nila.id] },
    };
    const added = s.addExpense(groupId, input);
    expect(added.ok).toBe(true);

    const balances = Object.fromEntries(useStore.getState().getGroupBalances(groupId).map((b) => [b.memberId, b.balance]));
    expect(balances).toEqual({ [me.id]: 6_000, [rakib.id]: -3_000, [nila.id]: -3_000 });

    const transfers = useStore.getState().getGroupSettlements(groupId);
    expect(transfers).toHaveLength(2);
    expect(transfers.every((t) => t.to === me.id && t.amount === 3_000)).toBe(true);

    if (!added.ok) throw new Error('unreachable');
    const updated = useStore.getState().updateExpense(groupId, added.expenseId, { ...input, amount: 3_000, payers: [{ memberId: me.id, amount: 3_000 }] });
    expect(updated.ok).toBe(true);
    expect(useStore.getState().getGroupSettlements(groupId).every((t) => t.amount === 1_000)).toBe(true);

    useStore.getState().deleteExpense(groupId, added.expenseId);
    expect(useStore.getState().getGroupSettlements(groupId)).toEqual([]);
  });

  test('invalid expenses are rejected and never stored', () => {
    const { groupId, me, rakib } = setupTrip();
    const base: ExpenseInput = {
      title: 'Taxi',
      amount: 5_000,
      payers: [{ memberId: me.id, amount: 5_000 }],
      personalBills: [],
      split: { type: 'equal', participantIds: [me.id, rakib.id] },
    };
    const { addExpense } = useStore.getState();

    expect(addExpense(groupId, { ...base, title: '   ' })).toEqual({ ok: false, error: { kind: 'title_required' } });
    expect(addExpense(groupId, { ...base, payers: [{ memberId: me.id, amount: 4_000 }] })).toEqual({
      ok: false,
      error: { kind: 'split', issue: { code: 'payers_mismatch', diff: 1_000 } },
    });
    expect(addExpense(groupId, { ...base, split: { type: 'equal', participantIds: ['ghost'] } })).toEqual({
      ok: false,
      error: { kind: 'unknown_member' },
    });
    expect(addExpense('nope', base)).toEqual({ ok: false, error: { kind: 'not_found' } });
    expect((useStore.getState().groups[0] as Group).expenses).toHaveLength(0);
  });
});

describe('removeMember', () => {
  test('re-splits shared costs among the remaining members', () => {
    const { groupId, me, rakib, nila } = setupTrip();
    useStore.getState().addExpense(groupId, {
      title: 'Hotel',
      amount: 9_000,
      payers: [{ memberId: me.id, amount: 9_000 }],
      personalBills: [],
      split: { type: 'equal', participantIds: [me.id, rakib.id, nila.id] },
    });

    const removed = useStore.getState().removeMember(groupId, nila.id);
    expect(removed).toEqual({ ok: true, balance: -3_000 });

    const group = useStore.getState().groups[0] as Group;
    expect(group.members.map((m) => m.id)).toEqual([me.id, rakib.id]);
    const balances = Object.fromEntries(useStore.getState().getGroupBalances(groupId).map((b) => [b.memberId, b.balance]));
    expect(balances).toEqual({ [me.id]: 4_500, [rakib.id]: -4_500 });
  });

  test("drops expenses that only the removed member paid for", () => {
    const { groupId, me, rakib, nila } = setupTrip();
    useStore.getState().addExpense(groupId, {
      title: 'Nila paid',
      amount: 6_000,
      payers: [{ memberId: nila.id, amount: 6_000 }],
      personalBills: [],
      split: { type: 'equal', participantIds: [me.id, rakib.id, nila.id] },
    });
    useStore.getState().removeMember(groupId, nila.id);
    expect((useStore.getState().groups[0] as Group).expenses).toHaveLength(0);
  });

  test('cannot remove yourself, unknown members, or shrink a group below two', () => {
    const { groupId, me, rakib, nila } = setupTrip();
    const { removeMember } = useStore.getState();
    expect(removeMember(groupId, me.id)).toEqual({ ok: false, reason: 'is_me' });
    expect(removeMember(groupId, 'ghost')).toEqual({ ok: false, reason: 'not_found' });
    expect(removeMember(groupId, nila.id).ok).toBe(true);
    expect(useStore.getState().removeMember(groupId, rakib.id)).toEqual({ ok: false, reason: 'min_members' });
  });
});

describe('dashboard and settings', () => {
  test('dashboard totals only count the current user', () => {
    const a = setupTrip();
    const idB = useStore.getState().createGroup({ name: 'Flat', icon: 'home', memberNames: ['Karim'] });
    const groupB = useStore.getState().groups.find((g) => g.id === idB) as Group;
    const karim = groupB.members[1];
    if (!karim) throw new Error('missing member');

    // In trip: I paid 90.00 for three → I am owed 60.00.
    useStore.getState().addExpense(a.groupId, {
      title: 'Dinner',
      amount: 9_000,
      payers: [{ memberId: a.me.id, amount: 9_000 }],
      personalBills: [],
      split: { type: 'equal', participantIds: [a.me.id, a.rakib.id, a.nila.id] },
    });
    // In flat: Karim paid 20.00 split equally → I owe 10.00.
    useStore.getState().addExpense(idB, {
      title: 'Rent share',
      amount: 2_000,
      payers: [{ memberId: karim.id, amount: 2_000 }],
      personalBills: [],
      split: { type: 'equal', participantIds: groupB.members.map((m) => m.id) },
    });

    const summary = useStore.getState().getDashboardSummary();
    expect(summary.totalOwedToMe).toBe(6_000);
    expect(summary.totalIOwe).toBe(1_000);
    expect(summary.net).toBe(5_000);
    expect(summary.groups).toHaveLength(2);
  });

  test('setters update theme, language and currency', () => {
    const s = useStore.getState();
    s.setTheme('ocean');
    s.setLanguage('en');
    s.setCurrency('GBP');
    const next = useStore.getState();
    expect([next.theme, next.language, next.currency]).toEqual(['ocean', 'en', 'GBP']);
  });

  test('only data (not actions) is persisted', async () => {
    useStore.getState().setTheme('forest');
    await new Promise((resolve) => setTimeout(resolve, 20));
    const raw = disk.get('bonton-store');
    expect(raw).toBeDefined();
    const saved = JSON.parse(raw ?? '{}') as { state: Record<string, unknown>; version: number };
    expect(saved.version).toBe(1);
    expect(Object.keys(saved.state).sort()).toEqual([
      'currency',
      'defaultSplitType',
      'font',
      'groups',
      'hasCompletedOnboarding',
      'language',
      'theme',
      'userAvatar',
      'userBio',
      'userName',
    ]);
    expect(saved.state.theme).toBe('forest');
  });
});
