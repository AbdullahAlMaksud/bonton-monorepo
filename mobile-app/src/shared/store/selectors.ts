import { useEffect, useMemo, useState } from 'react';

import {
  computeDashboardSummary,
  computeGroupBalances,
  computeGroupSettlements,
  computeGroupSummary,
  computeGroupTotal,
} from '@/shared/lib/group-math';
import type {
  Cents,
  DashboardSummary,
  Group,
  GroupId,
  GroupSummary,
  MemberBalance,
  Transfer,
} from '@/shared/types/bonton';

import { useBontonStore } from './bonton-store';

/** True once persisted state has been read from AsyncStorage. */
export function useStoreHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() => useBontonStore.persist.hasHydrated());

  useEffect(() => {
    const unsubscribe = useBontonStore.persist.onFinishHydration(() => setHydrated(true));
    // Covers the (unlikely) case where hydration finished between render and effect.
    setHydrated(useBontonStore.persist.hasHydrated());
    return unsubscribe;
  }, []);

  return hydrated;
}

export function useGroup(groupId: GroupId | undefined): Group | undefined {
  return useBontonStore((state) => state.groups.find((g) => g.id === groupId));
}

export function useGroupBalances(group: Group | undefined): MemberBalance[] {
  return useMemo(() => (group ? computeGroupBalances(group) : []), [group]);
}

export function useGroupSettlements(group: Group | undefined): Transfer[] {
  return useMemo(() => (group ? computeGroupSettlements(group) : []), [group]);
}

export function useGroupTotal(group: Group | undefined): Cents {
  return useMemo(() => (group ? computeGroupTotal(group) : 0), [group]);
}

export function useGroupSummary(group: Group): GroupSummary {
  return useMemo(() => computeGroupSummary(group), [group]);
}

export function useDashboardSummary(): DashboardSummary {
  const groups = useBontonStore((state) => state.groups);
  return useMemo(() => computeDashboardSummary(groups), [groups]);
}
