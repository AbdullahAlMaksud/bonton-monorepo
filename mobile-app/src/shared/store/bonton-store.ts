import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { createId } from '@/shared/lib/id';
import {
  computeDashboardSummary,
  computeGroupBalances,
  computeGroupSettlements,
} from '@/shared/lib/group-math';
import {
  computeShares,
  rebalanceExpenseAfterRemoval,
  type SplitIssue,
} from '@/shared/lib/settlement';
import type { ThemeName } from '@/shared/theme/themes';
import type {
  Cents,
  CurrencyCode,
  DashboardSummary,
  Expense,
  ExpenseCore,
  ExpenseId,
  ExpenseInput,
  FontName,
  Group,
  GroupIconName,
  GroupId,
  LangCode,
  Member,
  MemberBalance,
  MemberId,
  Transfer,
} from '@/shared/types/bonton';

/* -------------------------------------------------------------------------- */
/* Public types                                                                */
/* -------------------------------------------------------------------------- */

export interface CreateGroupInput {
  name: string;
  icon: GroupIconName;
  /** Everyone except the current user, who is added automatically as "You". */
  memberNames: string[];
}

export type AddMemberResult =
  | { ok: true; memberId: MemberId }
  | { ok: false; reason: 'not_found' | 'empty' | 'duplicate' };

export type RemoveMemberResult =
  | { ok: true; /** The leaver's net balance before removal (for the UI to report). */ balance: Cents }
  | { ok: false; reason: 'not_found' | 'is_me' | 'min_members' };

export type ExpenseError =
  | { kind: 'not_found' }
  | { kind: 'unknown_member' }
  | { kind: 'title_required' }
  | { kind: 'split'; issue: SplitIssue };

export type ExpenseOutcome = { ok: true; expenseId: ExpenseId } | { ok: false; error: ExpenseError };

export interface BontonState {
  groups: Group[];
  theme: ThemeName;
  language: LangCode;
  currency: CurrencyCode;
  font: FontName;
  userName: string;
  userBio: string;

  createGroup: (input: CreateGroupInput) => GroupId;
  updateGroup: (groupId: GroupId, patch: Partial<Pick<Group, 'name' | 'icon'>>) => void;
  deleteGroup: (groupId: GroupId) => void;
  addMember: (groupId: GroupId, name: string) => AddMemberResult;
  /** Removes the member and re-splits every affected expense (see rebalanceExpenseAfterRemoval). */
  removeMember: (groupId: GroupId, memberId: MemberId) => RemoveMemberResult;

  addExpense: (groupId: GroupId, input: ExpenseInput) => ExpenseOutcome;
  updateExpense: (groupId: GroupId, expenseId: ExpenseId, input: ExpenseInput) => ExpenseOutcome;
  deleteExpense: (groupId: GroupId, expenseId: ExpenseId) => void;

  getGroupBalances: (groupId: GroupId) => MemberBalance[];
  getGroupSettlements: (groupId: GroupId) => Transfer[];
  getDashboardSummary: () => DashboardSummary;

  setTheme: (theme: ThemeName) => void;
  setLanguage: (language: LangCode) => void;
  setCurrency: (currency: CurrencyCode) => void;
  setFont: (font: FontName) => void;
  setUserName: (name: string) => void;
  setUserBio: (bio: string) => void;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

const cleanName = (name: string): string => name.replace(/\s+/g, ' ').trim();
const nameKey = (name: string): string => cleanName(name).toLocaleLowerCase();

function referencedMemberIds(core: ExpenseCore): MemberId[] {
  const ids: MemberId[] = [
    ...core.payers.map((p) => p.memberId),
    ...core.personalBills.map((b) => b.memberId),
  ];
  switch (core.split.type) {
    case 'equal':
      ids.push(...core.split.participantIds);
      break;
    case 'percentage':
    case 'custom':
      ids.push(...core.split.entries.map((e) => e.memberId));
      break;
  }
  return ids;
}

function validateExpense(group: Group | undefined, input: ExpenseInput): ExpenseError | null {
  if (!group) return { kind: 'not_found' };
  if (cleanName(input.title) === '') return { kind: 'title_required' };
  const known = new Set(group.members.map((m) => m.id));
  if (referencedMemberIds(input).some((id) => !known.has(id))) return { kind: 'unknown_member' };
  const shares = computeShares(input);
  if (!shares.ok) return { kind: 'split', issue: shares.issue };
  return null;
}

function mapGroup(groups: Group[], groupId: GroupId, update: (group: Group) => Group): Group[] {
  return groups.map((g) => (g.id === groupId ? update(g) : g));
}

/** Persisted slice only — actions are never serialized. */
type PersistedState = Pick<
  BontonState,
  'groups' | 'theme' | 'language' | 'currency' | 'font' | 'userName' | 'userBio'
>;

export const DEFAULT_SETTINGS = {
  theme: 'light',
  language: 'bn',
  currency: 'BDT',
  font: 'hind-siliguri',
  userName: 'মাকসুদ',
  userBio: 'আপনার উপকরণ, রেসিপি পাতিলের।',
} as const satisfies Pick<
  PersistedState,
  'theme' | 'language' | 'currency' | 'font' | 'userName' | 'userBio'
>;

/* -------------------------------------------------------------------------- */
/* Store                                                                       */
/* -------------------------------------------------------------------------- */

export const useBontonStore = create<BontonState>()(
  persist(
    (set, get) => ({
      groups: [],
      theme: DEFAULT_SETTINGS.theme,
      language: DEFAULT_SETTINGS.language,
      currency: DEFAULT_SETTINGS.currency,
      font: DEFAULT_SETTINGS.font,
      userName: DEFAULT_SETTINGS.userName,
      userBio: DEFAULT_SETTINGS.userBio,

      createGroup: ({ name, icon, memberNames }) => {
        const now = Date.now();
        const seen = new Set<string>();
        const others: Member[] = [];
        for (const raw of memberNames) {
          const cleaned = cleanName(raw);
          const key = nameKey(cleaned);
          if (cleaned === '' || seen.has(key)) continue;
          seen.add(key);
          others.push({ id: createId('m_'), name: cleaned, isMe: false });
        }
        const group: Group = {
          id: createId('g_'),
          name: cleanName(name),
          icon,
          members: [{ id: createId('m_'), name: '', isMe: true }, ...others],
          expenses: [],
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ groups: [group, ...state.groups] }));
        return group.id;
      },

      updateGroup: (groupId, patch) => {
        const now = Date.now();
        set((state) => ({
          groups: mapGroup(state.groups, groupId, (g) => ({
            ...g,
            ...(patch.name !== undefined ? { name: cleanName(patch.name) } : {}),
            ...(patch.icon !== undefined ? { icon: patch.icon } : {}),
            updatedAt: now,
          })),
        }));
      },

      deleteGroup: (groupId) => {
        set((state) => ({ groups: state.groups.filter((g) => g.id !== groupId) }));
      },

      addMember: (groupId, name) => {
        const group = get().groups.find((g) => g.id === groupId);
        if (!group) return { ok: false, reason: 'not_found' };
        const cleaned = cleanName(name);
        if (cleaned === '') return { ok: false, reason: 'empty' };
        const key = nameKey(cleaned);
        if (group.members.some((m) => !m.isMe && nameKey(m.name) === key)) {
          return { ok: false, reason: 'duplicate' };
        }
        const member: Member = { id: createId('m_'), name: cleaned, isMe: false };
        const now = Date.now();
        set((state) => ({
          groups: mapGroup(state.groups, groupId, (g) => ({
            ...g,
            members: [...g.members, member],
            updatedAt: now,
          })),
        }));
        return { ok: true, memberId: member.id };
      },

      removeMember: (groupId, memberId) => {
        const group = get().groups.find((g) => g.id === groupId);
        const member = group?.members.find((m) => m.id === memberId);
        if (!group || !member) return { ok: false, reason: 'not_found' };
        if (member.isMe) return { ok: false, reason: 'is_me' };
        if (group.members.length <= 2) return { ok: false, reason: 'min_members' };

        const balance = computeGroupBalances(group).find((b) => b.memberId === memberId)?.balance ?? 0;
        const now = Date.now();

        const expenses = group.expenses.flatMap((expense): Expense[] => {
          if (!referencedMemberIds(expense).includes(memberId)) return [expense];
          const rebalanced = rebalanceExpenseAfterRemoval(expense, memberId);
          // null → nothing meaningful is left of this expense (e.g. the only payer left).
          return rebalanced ? [{ ...expense, ...rebalanced, updatedAt: now }] : [];
        });

        set((state) => ({
          groups: mapGroup(state.groups, groupId, (g) => ({
            ...g,
            members: g.members.filter((m) => m.id !== memberId),
            expenses,
            updatedAt: now,
          })),
        }));
        return { ok: true, balance };
      },

      addExpense: (groupId, input) => {
        const group = get().groups.find((g) => g.id === groupId);
        const error = validateExpense(group, input);
        if (error) return { ok: false, error };

        const now = Date.now();
        const expense: Expense = {
          ...input,
          title: cleanName(input.title),
          id: createId('e_'),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          groups: mapGroup(state.groups, groupId, (g) => ({
            ...g,
            expenses: [expense, ...g.expenses],
            updatedAt: now,
          })),
        }));
        return { ok: true, expenseId: expense.id };
      },

      updateExpense: (groupId, expenseId, input) => {
        const group = get().groups.find((g) => g.id === groupId);
        const existing = group?.expenses.find((e) => e.id === expenseId);
        if (!existing) return { ok: false, error: { kind: 'not_found' } };
        const error = validateExpense(group, input);
        if (error) return { ok: false, error };

        const now = Date.now();
        set((state) => ({
          groups: mapGroup(state.groups, groupId, (g) => ({
            ...g,
            expenses: g.expenses.map((e) =>
              e.id === expenseId
                ? { ...input, title: cleanName(input.title), id: e.id, createdAt: e.createdAt, updatedAt: now }
                : e,
            ),
            updatedAt: now,
          })),
        }));
        return { ok: true, expenseId };
      },

      deleteExpense: (groupId, expenseId) => {
        const now = Date.now();
        set((state) => ({
          groups: mapGroup(state.groups, groupId, (g) => ({
            ...g,
            expenses: g.expenses.filter((e) => e.id !== expenseId),
            updatedAt: now,
          })),
        }));
      },

      getGroupBalances: (groupId) => {
        const group = get().groups.find((g) => g.id === groupId);
        return group ? computeGroupBalances(group) : [];
      },

      getGroupSettlements: (groupId) => {
        const group = get().groups.find((g) => g.id === groupId);
        return group ? computeGroupSettlements(group) : [];
      },

      getDashboardSummary: () => computeDashboardSummary(get().groups),

      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setCurrency: (currency) => set({ currency }),
      setFont: (font) => set({ font }),
      setUserName: (userName) => set({ userName }),
      setUserBio: (userBio) => set({ userBio }),
    }),
    {
      name: 'bonton-store',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state): PersistedState => ({
        groups: state.groups,
        theme: state.theme,
        language: state.language,
        currency: state.currency,
        font: state.font || DEFAULT_SETTINGS.font,
        userName: state.userName || DEFAULT_SETTINGS.userName,
        userBio: state.userBio || DEFAULT_SETTINGS.userBio,
      }),
      // Add `if (version < 2) { … }` steps here when the persisted shape changes.
      migrate: (persisted) => persisted as PersistedState,
    },
  ),
);
