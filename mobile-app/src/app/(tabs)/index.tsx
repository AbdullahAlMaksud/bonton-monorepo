import { FolderKanban, Users } from 'lucide-react-native';
import { router } from 'expo-router';
import { FlatList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import {
  BalanceHero,
  GridBackground,
  GroupCard,
  WavyHeader,
} from '@/features/dashboard/components';
import { useFormatters } from '@/shared/hooks/use-formatters';
import { useBontonStore } from '@/shared/store/bonton-store';
import { useDashboardSummary } from '@/shared/store/selectors';
import type { Group, GroupSummary } from '@/shared/types/bonton';
import { EmptyState, Text } from '@/shared/ui';

export default function DashboardScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { theme } = useUnistyles();
  const fmt = useFormatters();

  const groups = useBontonStore((s) => s.groups);
  const summary = useDashboardSummary();

  const summaryByGroup = new Map<string, GroupSummary>(
    summary.groups.map((s) => [s.groupId, s]),
  );

  const openNewGroup = () => router.push('/groups/new');

  return (
    <View style={styles.root}>
      {/* 1. Global subtle dot matrix background */}
      <GridBackground size={24} />

      {/* 2. Top Status Bar Wavy Gradient in shades of gray */}
      <WavyHeader height={240} />

      {/* 3. Main Scrollable Content */}
      <FlatList<Group>
        data={groups}
        keyExtractor={(group) => group.id}
        contentContainerStyle={[
          styles.list,
          {
            paddingTop: insets.top + theme.spacing.sm,
          },
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            {/* 4. Top prominent Debts & Receivables (দেনা পাওনার হিসেব) */}
            <BalanceHero
              totalOwedToMe={summary.totalOwedToMe}
              totalIOwe={summary.totalIOwe}
              netBalance={summary.net}
              onNewGroup={openNewGroup}
              groupCount={groups.length}
            />

            {/* 5. Projects & Groups Section Header */}
            {groups.length > 0 ? (
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <FolderKanban size={20} color={theme.colors.primary} />
                  <Text variant="heading" style={styles.sectionTitle}>
                    {t('dashboard.projectsAndGroups')}
                  </Text>
                </View>

                {/* Group Count Badge */}
                <View style={styles.countBadge}>
                  <Text variant="caption" tone="secondary" style={styles.countText}>
                    {fmt.count(groups.length)}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon={Users}
            title={t('dashboard.emptyTitle')}
            body={t('dashboard.emptyBody')}
            actionLabel={t('dashboard.newGroup')}
            onAction={openNewGroup}
          />
        }
        renderItem={({ item, index }) => {
          const groupSummary = summaryByGroup.get(item.id);
          if (!groupSummary) return null;
          return (
            <GroupCard
              group={item}
              summary={groupSummary}
              index={index}
              onPress={() =>
                router.push({
                  pathname: '/groups/[id]',
                  params: { id: item.id },
                })
              }
            />
          );
        }}
        ItemSeparatorComponent={Separator}
      />
    </View>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create((theme) => ({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  list: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 110,
  },
  header: {
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: theme.spacing.xs,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    fontWeight: theme.typography.weight.bold,
  },
  countBadge: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.radius.pill,
  },
  countText: {
    fontWeight: theme.typography.weight.semibold,
  },
  separator: {
    height: theme.spacing.md,
  },
}));
