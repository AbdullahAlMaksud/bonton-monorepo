import { useCallback, useRef, useState, type ComponentRef } from 'react';
import {
  ArrowRight,
  Check,
  LayoutGrid,
  Pencil,
  Plus,
  Receipt,
  User,
  Users,
  X,
} from 'lucide-react-native';
import { Redirect, router, Stack } from 'expo-router';
import { BlurTargetView, BlurView } from 'expo-blur';
import type { NativeScrollEvent, NativeSyntheticEvent, ScrollViewInstance } from 'react-native';
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet as RNStyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { useFormatters } from '@/shared/hooks/use-formatters';
import { haptics } from '@/shared/lib/haptics';
import { BalancePill, EditProjectModal, WavyHeader } from '@/features/dashboard/components';
import { useBontonStore } from '@/shared/store/bonton-store';
import {
  useActiveGroup,
  useDashboardSummary,
  useGroupBalances,
  useGroupSettlements,
  useGroupTotal,
} from '@/shared/store/selectors';
import type { Expense, Group } from '@/shared/types/bonton';
import { BottomSheetModal, PressableScale, Text } from '@/shared/ui';

type ActiveTab = 'expenses' | 'balances' | 'settlements';
const TABS: ActiveTab[] = ['expenses', 'balances', 'settlements'];

export default function HomeScreen() {
  const hasCompletedOnboarding = useBontonStore((s) => s.hasCompletedOnboarding);

  if (!hasCompletedOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { theme } = useUnistyles();

  const groups = useBontonStore((s) => s.groups);
  const setActiveGroupId = useBontonStore((s) => s.setActiveGroupId);
  const userName = useBontonStore((s) => s.userName);
  const userAvatar = useBontonStore((s) => s.userAvatar);
  const currency = useBontonStore((s) => s.currency);
  const defaultSplitType = useBontonStore((s) => s.defaultSplitType);
  const dashboardSummary = useDashboardSummary();
  const fmt = useFormatters();

  const activeGroup = useActiveGroup();
  const balances = useGroupBalances(activeGroup);
  const settlements = useGroupSettlements(activeGroup);
  const totalSpent = useGroupTotal(activeGroup);

  const [activeTab, setActiveTab] = useState<ActiveTab>('expenses');
  const [switcherVisible, setSwitcherVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);

  const openNewProject = () => {
    haptics.tap();
    router.push('/groups/new');
  };

  const openAddExpense = () => {
    haptics.tap();
    if (activeGroup) {
      router.push({
        pathname: '/expense/add',
        params: { groupId: activeGroup.id },
      });
    } else {
      router.push('/groups/new');
    }
  };

  const openExpenseDetails = (expense: Expense) => {
    if (!activeGroup) return;
    haptics.tap();
    router.push({
      pathname: '/expense/add',
      params: { groupId: activeGroup.id, expenseId: expense.id },
    });
  };

  // Build the participant names subtitle string matching the screenshot
  const participantNames = activeGroup
    ? activeGroup.members
      .map((m) => (m.isMe ? userName || 'Abdullah Al Maksud' : m.name))
      .join(' ')
    : '';

  // Repeating participant names if short, to achieve the multi-line member list seen in the wireframe
  const repeatedParticipantNames =
    participantNames.length > 0 && participantNames.length < 80
      ? `${participantNames} ${participantNames} ${participantNames}`
      : participantNames;

  const totalExpenseWhole = Math.round(totalSpent / 100);
  const participantCount = activeGroup?.members.length ?? 0;

  // Window dimensions & responsive pager measurements
  const { width: screenWidth } = useWindowDimensions();
  const safeWidth = screenWidth > 0 ? screenWidth : 375;
  const tabWidth = (safeWidth - 40) / 3;

  const pagerRef = useRef<ScrollViewInstance>(null);

  const blurTargetRef = useRef<ComponentRef<typeof View> | null>(null);
  const [, setBlurTargetReady] = useState(false);
  const setBlurTargetRef = useCallback((node: ComponentRef<typeof View> | null) => {
    blurTargetRef.current = node;
    if (node) {
      setBlurTargetReady(true);
    }
  }, []);

  const scrollX = useSharedValue(0);
  const currentTabSharedIndex = useSharedValue(0);

  const updateActiveTabFromScroll = useCallback(
    (index: number) => {
      const tab = TABS[index];
      if (tab && tab !== activeTab) {
        haptics.select();
        setActiveTab(tab);
      }
    },
    [activeTab]
  );

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
      const pageIndex = Math.min(
        2,
        Math.max(0, Math.round(event.contentOffset.x / safeWidth))
      );
      if (pageIndex !== currentTabSharedIndex.value) {
        currentTabSharedIndex.value = pageIndex;
        runOnJS(updateActiveTabFromScroll)(pageIndex);
      }
    },
  });

  const handleMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const pageIndex = Math.min(2, Math.max(0, Math.round(offsetX / safeWidth)));
    const targetTab = TABS[pageIndex];
    if (targetTab && targetTab !== activeTab) {
      haptics.select();
      setActiveTab(targetTab);
    }
  };

  const handleTabPress = (tab: ActiveTab) => {
    if (tab === activeTab) return;
    haptics.select();
    const targetIndex = TABS.indexOf(tab);
    currentTabSharedIndex.value = targetIndex;
    setActiveTab(tab);
    pagerRef.current?.scrollTo({
      x: targetIndex * safeWidth,
      animated: true,
    });
  };

  const indicatorAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: (scrollX.value / safeWidth) * tabWidth,
        },
      ],
    };
  });

  // Find user's net balance
  const userNetBalance = dashboardSummary.net;

  const currentSplitType = activeGroup?.defaultSplitType ?? defaultSplitType;
  const splittingMethodLabel = (() => {
    switch (currentSplitType) {
      case 'equal':
        return t('home.equal', 'Equal');
      case 'percentage':
        return t('expense.splitPercentage', 'Percentage');
      case 'custom':
        return t('expense.splitCustom', 'Custom');
      default:
        return t('home.equal', 'Equal');
    }
  })();

  const headerTextColor = theme.isDark ? theme.colors.text : theme.colors.onPrimary;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* ============================================================ */}
      {/* 1. FIXED TOP STICKY AREA (Header + Summary Card + Tabs)       */}
      {/* ============================================================ */}
      <View style={styles.fixedTopSection}>
        {/* Curvy multilayered background with theme primary gradient */}
        <BlurTargetView ref={setBlurTargetRef}>
          <View style={[styles.headerSection, { paddingTop: insets.top + 8 }]}>
            <WavyHeader style={styles.headerWavyBackground} height="250%" variant="tall" />

            {/* Top User Info & New Project Row */}
            <View style={styles.topBarRow}>
              {/* Left: User Avatar & Name & Interactive Balance Pill */}
              <View style={styles.userInfoCol}>
                <View style={styles.avatarCircle}>
                  {userAvatar?.startsWith('emoji:') ? (
                    <Text style={styles.avatarEmoji}>{userAvatar.replace('emoji:', '')}</Text>
                  ) : userAvatar ? (
                    <Image source={{ uri: userAvatar }} style={styles.avatarImage} />
                  ) : (
                    <User
                      size={24}
                      color={theme.isDark ? theme.colors.text : theme.colors.primary}
                      strokeWidth={2.2}
                    />
                  )}
                </View>
                <View style={styles.userTextCol}>
                  <Text style={styles.userNameText}>
                    {userName || 'Abdullah Al Maksud'}
                  </Text>
                  <BalancePill netBalance={userNetBalance} />
                </View>
              </View>

              {/* Right: + New Project Button */}
              <PressableScale
                scaleTo={0.94}
                onPress={openNewProject}
                style={styles.newProjectButton}
              >
                <Text style={styles.newProjectButtonText}>{t('home.newProject', '+ New Project')}</Text>
              </PressableScale>
            </View>

            {/* Project Title & Action Buttons Row */}
            <View style={styles.projectTitleRow}>
              <Text style={styles.projectTitleText} numberOfLines={1}>
                {activeGroup?.name ?? t('home.noProjectsTitle', 'Sajek Tour')}
              </Text>
              <View style={styles.headerButtonsRow}>
                {activeGroup ? (
                  <PressableScale
                    scaleTo={0.88}
                    onPress={() => {
                      haptics.tap();
                      setEditModalVisible(true);
                    }}
                    style={styles.headerIconButton}
                    accessibilityLabel={t('home.editProject', 'Edit Project')}
                  >
                    <Pencil size={22} color={headerTextColor} strokeWidth={2.2} />
                  </PressableScale>
                ) : null}
                <PressableScale
                  scaleTo={0.88}
                  onPress={() => setSwitcherVisible(true)}
                  style={styles.headerIconButton}
                  accessibilityLabel={t('home.switchProject', 'Switch Project')}
                >
                  <LayoutGrid size={24} color={headerTextColor} strokeWidth={2} />
                </PressableScale>
              </View>
            </View>

            {/* Project Description or Participants Subtitle */}
            <Text style={styles.participantsSubtitle} numberOfLines={3}>
              {activeGroup?.description
                ? `${activeGroup.description} · ${participantNames}`
                : repeatedParticipantNames ||
                  'Abdullah Al Maksud Tanvir Rahim Karim Abdullah Al Maksud Tanvir Rahim Karim'}
            </Text>
          </View>
        </BlurTargetView>

        {/* Floating Summary Stats Card */}
        <View style={styles.summaryCardWrapper}>
          <View style={styles.summaryCard}>
            {/* Frosted Glass Blur Backdrop */}
            <BlurView
              blurTarget={blurTargetRef}
              blurMethod="dimezisBlurView"
              blurReductionFactor={Platform.OS === 'android' ? 2 : 4}
              intensity={Platform.OS === 'ios' ? 75 : 85}
              tint={theme.isDark ? 'dark' : 'light'}
              style={RNStyleSheet.absoluteFill}
            />
            {/* Glass Tint Overlay */}
            <View style={styles.summaryCardGlassTint} />
            {/* Top specular reflection sheen */}
            <View style={styles.glassTopShine} pointerEvents="none" />

            {/* Left Column: Total Expense & Big Amount */}
            <View style={styles.expenseCol}>
              <Text style={styles.statsLabel}>
                {t('home.totalExpense', 'Total Expense')}
              </Text>
              <View style={styles.amountRow}>
                <Text style={styles.amountNumber}>
                  {totalExpenseWhole > 0 ? totalExpenseWhole : 0}
                </Text>
                <Text style={styles.amountCurrency}>{currency}</Text>
              </View>
            </View>

            {/* Right Column: Participant Count & Splitting Method */}
            <View style={styles.infoCol}>
              {/* Item 1: Total Participant */}
              <View>
                <Text style={styles.statsLabel}>
                  {t('home.totalParticipant', 'Total Participant')}
                </Text>
                <Text style={styles.statsValue}>
                  {t('home.personCount', {
                    count: fmt.count(participantCount > 0 ? participantCount : 1),
                  })}
                </Text>
              </View>

              {/* Item 2: Splitting Method */}
              <View style={styles.splitMethodItem}>
                <Text style={styles.statsLabel}>
                  {t('home.splittingMethod', 'Splitting Method')}
                </Text>
                <Text style={styles.statsValue}>
                  {splittingMethodLabel}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Segmented Tabs (খরচ | ব্যালেন্স | মেটানো) */}
        <View style={styles.tabContainer}>
          {/* Animated sliding indicator pill */}
          <Animated.View
            style={[
              styles.tabIndicator,
              { width: tabWidth },
              indicatorAnimatedStyle,
            ]}
          />

          <PressableScale
            scaleTo={0.96}
            onPress={() => handleTabPress('expenses')}
            style={styles.tabPill}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'expenses' && styles.tabTextActive,
              ]}
            >
              {t('home.tabs.expenses', 'খরচ')}
            </Text>
          </PressableScale>

          <PressableScale
            scaleTo={0.96}
            onPress={() => handleTabPress('balances')}
            style={styles.tabPill}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'balances' && styles.tabTextActive,
              ]}
            >
              {t('home.tabs.balances', 'ব্যালেন্স')}
            </Text>
          </PressableScale>

          <PressableScale
            scaleTo={0.96}
            onPress={() => handleTabPress('settlements')}
            style={styles.tabPill}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'settlements' && styles.tabTextActive,
              ]}
            >
              {t('home.tabs.settlements', 'মেটানো')}
            </Text>
          </PressableScale>
        </View>
      </View>

      {/* ============================================================ */}
      {/* 2. TAB CONTENT / HORIZONTAL SWIPE PAGER (Scrollable Items)    */}
      {/* ============================================================ */}
      <Animated.ScrollView
        ref={pagerRef as any}
        horizontal
        pagingEnabled
        nestedScrollEnabled={true}
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
        directionalLockEnabled={true}
        overScrollMode="never"
        style={styles.pagerScroll}
      >
        {/* Tab 0: Expenses */}
        <View style={[styles.pagerPage, { width: safeWidth }]}>
          <ScrollView
            style={styles.tabScrollView}
            contentContainerStyle={styles.tabScrollContent}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
            <ExpensesTabView
              group={activeGroup}
              onExpensePress={openExpenseDetails}
              onAddPress={openAddExpense}
            />
          </ScrollView>
        </View>

        {/* Tab 1: Balances */}
        <View style={[styles.pagerPage, { width: safeWidth }]}>
          <ScrollView
            style={styles.tabScrollView}
            contentContainerStyle={styles.tabScrollContent}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
            <BalancesTabView group={activeGroup} balances={balances} />
          </ScrollView>
        </View>

        {/* Tab 2: Settlements */}
        <View style={[styles.pagerPage, { width: safeWidth }]}>
          <ScrollView
            style={styles.tabScrollView}
            contentContainerStyle={styles.tabScrollContent}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
            <SettlementsTabView group={activeGroup} settlements={settlements} />
          </ScrollView>
        </View>
      </Animated.ScrollView>

      {/* ============================================================ */}
      {/* 5. PROJECT SWITCHER BOTTOM SHEET                              */}
      {/* ============================================================ */}
      <BottomSheetModal
        visible={switcherVisible}
        onClose={() => setSwitcherVisible(false)}
        maxHeight="80%"
      >
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {t('home.switchProject', 'Switch Project')}
          </Text>
          <PressableScale
            scaleTo={0.9}
            onPress={() => setSwitcherVisible(false)}
            style={styles.modalCloseButton}
          >
            <X size={20} color={theme.colors.textSecondary} />
          </PressableScale>
        </View>

        <ScrollView
          style={styles.modalList}
          contentContainerStyle={styles.modalListContent}
          showsVerticalScrollIndicator={false}
        >
          {groups.map((group) => {
            const isSelected = group.id === activeGroup?.id;
            return (
              <PressableScale
                key={group.id}
                scaleTo={0.97}
                onPress={() => {
                  haptics.select();
                  setActiveGroupId(group.id);
                  setSwitcherVisible(false);
                }}
                style={[
                  styles.projectRowItem,
                  isSelected && styles.projectRowItemSelected,
                ]}
              >
                <View style={styles.projectRowLeft}>
                  <View style={styles.projectIconCircle}>
                    <Users size={18} color={theme.colors.primary} />
                  </View>
                  <View>
                    <Text style={styles.projectNameItem}>
                      {group.name}
                    </Text>
                    <Text style={styles.projectMetaItem}>
                      {group.members.length} members · {group.expenses.length} expenses
                    </Text>
                  </View>
                </View>
                {isSelected && (
                  <View style={styles.selectedBadge}>
                    <Check size={16} color={theme.colors.onPrimary} strokeWidth={2.5} />
                  </View>
                )}
              </PressableScale>
            );
          })}
        </ScrollView>

        <PressableScale
          scaleTo={0.95}
          onPress={() => {
            setSwitcherVisible(false);
            openNewProject();
          }}
          style={styles.modalNewProjectBtn}
        >
          <Plus size={18} color={theme.colors.primaryText} strokeWidth={2.4} />
          <Text style={styles.modalNewProjectText}>
            {t('home.newProject', '+ New Project')}
          </Text>
        </PressableScale>
      </BottomSheetModal>

      {/* Edit Active Project Modal */}
      {activeGroup ? (
        <EditProjectModal
          visible={editModalVisible}
          onClose={() => setEditModalVisible(false)}
          group={activeGroup}
        />
      ) : null}
    </View>
  );
}

/* ========================================================================== */
/* EXPENSES TAB VIEW                                                          */
/* ========================================================================== */
interface ExpensesTabViewProps {
  group: Group | undefined;
  onExpensePress: (expense: Expense) => void;
  onAddPress: () => void;
}

function ExpensesTabView({ group, onExpensePress, onAddPress }: ExpensesTabViewProps) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const fmt = useFormatters();

  const expenses = group?.expenses ?? [];
  const membersById = new Map(group?.members.map((m) => [m.id, m]));

  if (expenses.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Receipt size={32} color={theme.colors.textSecondary} />
        <Text style={styles.emptyTitle}>
          {t('group.noExpensesTitle', 'এখনও কোনো খরচ নেই')}
        </Text>
        <Text style={styles.emptySubtitle}>
          {t('group.noExpensesBody', 'নিচের প্লাস বাটনে চাপ দিয়ে খরচ যোগ করুন।')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.tabContentCol}>
      {expenses.map((expense) => {
        const payerNames = expense.payers
          .map((p) => membersById.get(p.memberId))
          .flatMap((m) => (m ? [fmt.memberName(m)] : []))
          .join(', ');

        return (
          <PressableScale
            key={expense.id}
            scaleTo={0.98}
            onPress={() => onExpensePress(expense)}
            style={styles.expenseCardRow}
          >
            <View style={styles.expenseCardLeft}>
              <Text style={styles.expenseCardTitle} numberOfLines={1}>
                {expense.title}
              </Text>
              <Text style={styles.expenseCardMeta} numberOfLines={1}>
                {payerNames || 'Abdullah'} · {fmt.date(expense.createdAt)}
              </Text>
            </View>
            <View style={styles.expenseCardRight}>
              <Text style={styles.expenseCardAmount}>
                {fmt.money(expense.amount)}
              </Text>
            </View>
          </PressableScale>
        );
      })}
    </View>
  );
}

/* ========================================================================== */
/* BALANCES TAB VIEW                                                          */
/* ========================================================================== */
interface BalancesTabViewProps {
  group: Group | undefined;
  balances: { memberId: string; balance: number }[];
}

function BalancesTabView({ group, balances }: BalancesTabViewProps) {
  const { t } = useTranslation();
  const fmt = useFormatters();
  const membersById = new Map(group?.members.map((m) => [m.id, m]));

  if (!group || balances.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptySubtitle}>
          {t('group.noBalances', 'কোনো ব্যালেন্স হিসাব পাওয়া যায়নি')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.tabContentCol}>
      {balances.map((item) => {
        const member = membersById.get(item.memberId);
        if (!member) return null;
        const isPositive = item.balance > 0;
        const isNegative = item.balance < 0;

        return (
          <View key={item.memberId} style={styles.balanceCardRow}>
            <View style={styles.balanceLeft}>
              <View style={styles.balanceAvatar}>
                <Text style={styles.balanceAvatarInitial}>
                  {(member.name || 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={styles.balanceNameText}>
                  {fmt.memberName(member)}
                </Text>
                <Text style={styles.balanceStatusText}>
                  {isPositive
                    ? t('group.getsBack', 'Gets back')
                    : isNegative
                      ? t('group.owes', 'Owes')
                      : t('group.settled', 'Settled up')}
                </Text>
              </View>
            </View>
            <Text
              style={[
                styles.balanceAmountText,
                isPositive && styles.positiveAmount,
                isNegative && styles.negativeAmount,
              ]}
            >
              {isPositive ? `+${fmt.money(item.balance)}` : fmt.money(item.balance)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

/* ========================================================================== */
/* SETTLEMENTS TAB VIEW                                                       */
/* ========================================================================== */
interface SettlementsTabViewProps {
  group: Group | undefined;
  settlements: { from: string; to: string; amount: number }[];
}

function SettlementsTabView({ group, settlements }: SettlementsTabViewProps) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const fmt = useFormatters();
  const membersById = new Map(group?.members.map((m) => [m.id, m]));

  if (!group || settlements.length === 0) {
    return (
      <View style={styles.tabContentCol}>
        <View style={styles.settledCard}>
          <Check size={28} color={theme.colors.success} />
          <Text style={styles.settledText}>
            {t('group.allSettled', 'All balances are settled!')}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.tabContentCol}>
      {settlements.map((tx, idx) => {
        const fromMember = membersById.get(tx.from);
        const toMember = membersById.get(tx.to);

        return (
          <View key={`${tx.from}-${tx.to}-${idx}`} style={styles.settlementCardRow}>
            <View style={styles.settlementLeft}>
              <Text style={styles.settlementName} numberOfLines={1}>
                {fromMember ? fmt.memberName(fromMember) : 'Member'}
              </Text>
              <ArrowRight size={16} color={theme.colors.textSecondary} style={{ marginHorizontal: 6 }} />
              <Text style={styles.settlementName} numberOfLines={1}>
                {toMember ? fmt.memberName(toMember) : 'Member'}
              </Text>
            </View>
            <Text style={styles.settlementAmount}>
              {fmt.money(tx.amount)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

/* ========================================================================== */
/* STYLES (100% Theme-bound)                                                  */
/* ========================================================================== */
const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  fixedTopSection: {
    zIndex: 10,
  },

  /* --- Top Header (Curvy multilayered theme primary background) --- */
  headerSection: {
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    paddingBottom: 140,
    position: 'relative',
    overflow: 'hidden',
  },
  headerWavyBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 26,
  },
  userInfoCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.isDark ? theme.colors.background : theme.colors.onPrimary,
    borderWidth: 1.5,
    borderColor: theme.isDark ? theme.colors.border : 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
  },
  avatarEmoji: {
    fontSize: 22,
  },
  userTextCol: {
    gap: 4,
  },
  userNameText: {
    color: theme.isDark ? theme.colors.text : theme.colors.onPrimary,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  newProjectButton: {
    backgroundColor: theme.isDark ? theme.colors.primary : theme.colors.onPrimary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.sm,
  },
  newProjectButtonText: {
    color: theme.isDark ? theme.colors.onPrimary : theme.colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  projectTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  projectTitleText: {
    color: theme.isDark ? theme.colors.text : theme.colors.onPrimary,
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.5,
    flex: 1,
  },
  headerButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 12,
  },
  headerIconButton: {
    padding: 6,
  },
  participantsSubtitle: {
    color: theme.isDark ? theme.colors.textSecondary : 'rgba(255, 255, 255, 0.72)',
    fontSize: 13,
    lineHeight: 18,
  },

  /* --- Floating Summary Card --- */
  summaryCardWrapper: {
    paddingHorizontal: 16,
    marginTop: -120,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: theme.isDark ? 0.35 : 0.08,
    shadowRadius: 16,
  },
  summaryCard: {
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.90)',
    borderBottomColor: theme.isDark ? 'rgba(255, 255, 255, 0.20)' : 'rgba(203, 213, 225, 0.85)',
    borderLeftColor: theme.isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(203, 213, 225, 0.75)',
    borderRightColor: theme.isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(203, 213, 225, 0.75)',
    overflow: 'hidden',
    position: 'relative',
  },
  summaryCardGlassTint: {
    ...RNStyleSheet.absoluteFill,
    backgroundColor: theme.isDark
      ? 'rgba(255, 255, 255, 0.05)'
      : 'rgba(255, 255, 255, 0.22)',
  },
  glassTopShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
  },
  expenseCol: {
    flex: 1,
  },
  statsLabel: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 3,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  amountNumber: {
    color: theme.colors.text,
    fontSize: theme.typography.size.xxl * 1.5,
    fontWeight: '900',
    letterSpacing: 1,
    lineHeight: theme.typography.lineHeight.lg * 3
  },
  amountCurrency: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.size.md,
    lineHeight: theme.typography.lineHeight.lg * 2,
    fontWeight: '800',
    marginLeft: 4,
    marginBottom: 6,
    alignSelf: 'flex-end',
  },
  infoCol: {
    flex: 1,
    paddingLeft: 16,
  },
  statsValue: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  splitMethodItem: {
    marginTop: 10,
  },

  /* --- Segmented Tabs --- */
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 18,
    padding: 4,
    height: 48,
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
  },
  tabPill: {
    flex: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  tabPillActive: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: theme.colors.onPrimary,
    fontWeight: '700',
  },

  /* --- Horizontal Pager & List Content --- */
  pagerScroll: {
    flex: 1,
    marginTop: 14,
  },
  pagerPage: {
    flex: 1,
  },
  tabScrollView: {
    flex: 1,
  },
  tabScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 110,
  },
  tabContentCol: {
    gap: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  expenseCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  expenseCardLeft: {
    flex: 1,
    gap: 4,
  },
  expenseCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  expenseCardMeta: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  expenseCardRight: {
    marginLeft: 12,
  },
  expenseCardAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.primaryText,
  },

  /* --- Balance & Settlement Cards --- */
  balanceCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  balanceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  balanceAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceAvatarInitial: {
    color: theme.colors.primaryText,
    fontWeight: '700',
    fontSize: 14,
  },
  balanceNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
  },
  balanceStatusText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  balanceAmountText: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
  },
  positiveAmount: {
    color: theme.colors.success,
  },
  negativeAmount: {
    color: theme.colors.danger,
  },
  settlementCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  settlementLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settlementName: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
  },
  settlementAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.primaryText,
  },
  settledCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    borderRadius: 16,
    backgroundColor: theme.colors.successMuted,
    gap: 8,
  },
  settledText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.success,
  },

  /* --- Modal Switcher --- */
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  modalCloseButton: {
    padding: 6,
  },
  modalList: {
    maxHeight: 280,
  },
  modalListContent: {
    paddingBottom: theme.spacing.sm,
  },
  projectRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginBottom: 8,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  projectRowItemSelected: {
    backgroundColor: theme.colors.primaryMuted,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  projectRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  projectIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  projectNameItem: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
  },
  projectMetaItem: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  selectedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalNewProjectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: theme.colors.primaryMuted,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalNewProjectText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.primaryText,
  },
}));
