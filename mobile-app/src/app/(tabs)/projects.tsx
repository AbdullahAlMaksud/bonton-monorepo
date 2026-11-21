import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  ChevronRight,
  FolderKanban,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  Users,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet as RNStyleSheet,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { EditProjectModal, GridBackground } from '@/features/dashboard/components';
import { useFormatters } from '@/shared/hooks/use-formatters';
import { haptics } from '@/shared/lib/haptics';
import { useBontonStore } from '@/shared/store/bonton-store';
import { useDashboardSummary } from '@/shared/store/selectors';
import type { Group, GroupSummary } from '@/shared/types/bonton';
import { EmptyState, PressableScale, Text } from '@/shared/ui';

interface ConfirmModalState {
  visible: boolean;
  type: 'danger' | 'warning' | 'info';
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
}

export default function ProjectsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { theme } = useUnistyles();
  const fmt = useFormatters();

  const groups = useBontonStore((s) => s.groups);
  const activeGroupId = useBontonStore((s) => s.activeGroupId);
  const setActiveGroupId = useBontonStore((s) => s.setActiveGroupId);
  const deleteGroup = useBontonStore((s) => s.deleteGroup);

  const isGlassEffectAvailable = useMemo(() => {
    if (Platform.OS !== 'ios') return false;
    try {
      return isGlassEffectAPIAvailable();
    } catch {
      return false;
    }
  }, []);

  const summary = useDashboardSummary();
  const summaryByGroup = new Map<string, GroupSummary>(
    summary.groups.map((s) => [s.groupId, s]),
  );

  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const closeConfirmModal = () =>
    setConfirmModal((prev) => ({ ...prev, visible: false }));

  const openNewGroup = () => {
    haptics.select();
    router.push('/groups/new');
  };

  const onSelectProject = (group: Group) => {
    haptics.select();
    setActiveGroupId(group.id);
    router.push('/(tabs)');
  };

  const onEditProject = (group: Group) => {
    haptics.select();
    setEditingGroup(group);
  };

  const onDeleteProject = (group: Group) => {
    haptics.warning();
    if (groups.length <= 1) {
      setConfirmModal({
        visible: true,
        type: 'warning',
        title: t('projects.alertTitle', 'সতর্কতা'),
        message: t('projects.minOneGroup', 'কমপক্ষে একটি গ্রুপ থাকতে হবে।'),
        cancelLabel: t('common.close', 'ঠিক আছে'),
      });
      return;
    }

    setConfirmModal({
      visible: true,
      type: 'danger',
      title: t('projects.deleteConfirmTitle', 'গ্রুপটি মুছে ফেলবেন?'),
      message: t('projects.deleteConfirmBody', { name: group.name }),
      cancelLabel: t('common.cancel', 'বাতিল'),
      confirmLabel: t('common.delete', 'মুছে ফেলুন'),
      onConfirm: () => {
        haptics.success();
        deleteGroup(group.id);
      },
    });
  };

  return (
    <View style={styles.root}>
      {/* Subtle Dot matrix background */}
      <GridBackground size={24} />

      {/* Screen Header */}
      <View style={[styles.topHeader, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerTitleContainer}>
          {/* <View style={styles.titleBadgeRow}> */}
          <Text style={styles.headerTitle}>
            {t('projects.title', 'গ্রুপসমূহ')}
          </Text>

          {/* </View> */}

        </View>

        <PressableScale
          scaleTo={0.94}
          onPress={openNewGroup}
          style={styles.newProjectButton}
          accessibilityLabel={t('projects.newProject', 'নতুন গ্রুপ')}
        >
          <Plus size={16} color={theme.colors.onPrimary} strokeWidth={2.8} />
          <Text style={styles.newProjectButtonText}>
            {t('projects.newProject', 'নতুন গ্রুপ')}
          </Text>
        </PressableScale>
      </View>

      {/* Projects List */}
      <FlatList<Group>
        data={groups}
        keyExtractor={(group) => group.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon={FolderKanban}
            title={t('projects.emptyTitle', 'কোনো গ্রুপ নেই')}
            body={t('projects.emptyBody', 'খরচের হিসাব শুরু করতে একটি নতুন গ্রুপ তৈরি করুন।')}
            actionLabel={t('projects.newProject', 'নতুন গ্রুপ')}
            onAction={openNewGroup}
          />
        }
        renderItem={({ item, index }) => {
          const groupSummary = summaryByGroup.get(item.id);
          const balance = groupSummary?.myBalance ?? 0;
          const totalSpent = groupSummary?.totalSpent ?? 0;
          const isActive = item.id === activeGroupId;

          const isOwed = balance > 0;
          const owes = balance < 0;

          const balanceText = isOwed
            ? t('projects.youAreOwed', { amount: fmt.money(balance) })
            : owes
              ? t('projects.youOwe', { amount: fmt.money(-balance) })
              : t('projects.settledUp', 'হিসাব সমান');

          return (
            <Animated.View entering={FadeInDown.duration(280).delay(Math.min(index, 6) * 45)}>
              <PressableScale
                scaleTo={0.98}
                onPress={() => onSelectProject(item)}
                style={styles.cardWrapper}
              >
                <GlassView
                  glassEffectStyle="regular"
                  colorScheme={theme.isDark ? 'dark' : 'light'}
                  style={[
                    styles.card,
                    isActive && styles.cardActive,
                  ]}
                >
                  {/* Frosted Glass Blur Backdrop */}
                  {(!isGlassEffectAvailable || Platform.OS === 'android') && (
                    <BlurView
                      intensity={Platform.OS === 'ios' ? 75 : 45}
                      tint={theme.isDark ? 'dark' : 'light'}
                      style={[RNStyleSheet.absoluteFill, { borderRadius: 18 }]}
                    />
                  )}
                  {/* Subtle Glass Tint Overlay */}
                  <View style={styles.cardGlassTint} pointerEvents="none" />
                  {/* Top specular reflection sheen */}
                  <View style={styles.glassTopShine} pointerEvents="none" />

                  {/* Card Top: Group Icon, Title & Subtle Actions */}
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      <View style={[styles.groupAvatar, isActive && styles.groupAvatarActive]}>
                        <Users
                          size={20}
                          color={isActive ? theme.colors.primary : theme.colors.textSecondary}
                          strokeWidth={2.2}
                        />
                      </View>

                      <View style={styles.nameGroup}>
                        <View style={styles.titleRow}>
                          <Text style={styles.groupName} numberOfLines={1}>
                            {item.name}
                          </Text>
                          {isActive ? (
                            <View style={styles.activeDotBadge}>
                              <View style={styles.activeDot} />
                              <Text style={styles.activeDotText}>
                                {t('projects.active', 'সক্রিয়')}
                              </Text>
                            </View>
                          ) : null}
                        </View>

                        {/* Meta: members & expense counts */}
                        <Text style={styles.metaSubtitle} numberOfLines={1}>
                          {t('projects.membersCount', { count: fmt.count(item.members.length) })} · {t('projects.expensesCount', { count: fmt.count(item.expenses.length) })}
                        </Text>
                      </View>
                    </View>

                    {/* Actions: Subtle Ghost Edit & Delete */}
                    <View style={styles.actionsRow}>
                      <PressableScale
                        scaleTo={0.88}
                        onPress={() => onEditProject(item)}
                        style={styles.ghostActionBtn}
                        hitSlop={6}
                        accessibilityLabel={t('common.edit', 'এডিট')}
                      >
                        <Pencil size={15} color={theme.colors.textSecondary} strokeWidth={2} />
                      </PressableScale>

                      <PressableScale
                        scaleTo={0.88}
                        onPress={() => onDeleteProject(item)}
                        style={[styles.ghostActionBtn, styles.ghostDeleteBtn]}
                        hitSlop={6}
                        accessibilityLabel={t('common.delete', 'ডিলিট')}
                      >
                        <Trash2 size={15} color={theme.colors.danger} strokeWidth={2} />
                      </PressableScale>
                    </View>
                  </View>

                  {/* Card Footer: Total Spent & Modern Financial Chip */}
                  <View style={styles.cardFooter}>
                    <View style={styles.spentCol}>
                      <Text style={styles.spentLabel}>
                        {t('home.totalExpense', 'মোট খরচ')}
                      </Text>
                      <Text style={styles.spentValue}>
                        {fmt.money(totalSpent)}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.balanceBadge,
                        isOwed
                          ? styles.badgeOwed
                          : owes
                            ? styles.badgeOwe
                            : styles.badgeSettled,
                      ]}
                    >
                      {isOwed ? (
                        <ArrowDownLeft size={13} color={theme.isDark ? '#4ADE80' : '#059669'} strokeWidth={2.4} />
                      ) : owes ? (
                        <ArrowUpRight size={13} color={theme.isDark ? '#F87171' : '#E11D48'} strokeWidth={2.4} />
                      ) : (
                        <Check size={13} color={theme.colors.textSecondary} strokeWidth={2.4} />
                      )}
                      <Text
                        style={[
                          styles.balanceText,
                          isOwed
                            ? styles.balanceTextSuccess
                            : owes
                              ? styles.balanceTextDanger
                              : styles.balanceTextMuted,
                        ]}
                        numberOfLines={1}
                      >
                        {balanceText}
                      </Text>
                      <ChevronRight size={13} color={theme.colors.textSecondary} strokeWidth={2} />
                    </View>
                  </View>
                </GlassView>
              </PressableScale>
            </Animated.View>
          );
        }}
        ItemSeparatorComponent={Separator}
      />

      {/* Edit Project Modal */}
      {editingGroup ? (
        <EditProjectModal
          visible={Boolean(editingGroup)}
          onClose={() => setEditingGroup(null)}
          group={editingGroup}
        />
      ) : null}

      {/* Custom Confirmation / Alert Modal */}
      {confirmModal.visible && (
        <Modal
          visible={confirmModal.visible}
          transparent
          statusBarTranslucent
          animationType="fade"
          onRequestClose={closeConfirmModal}
        >
          <View style={styles.modalBackdrop}>
            <Pressable style={styles.modalDismissArea} onPress={closeConfirmModal} />
            <View style={styles.modalCard}>
              <View
                style={[
                  styles.modalIconContainer,
                  confirmModal.type === 'danger'
                    ? styles.modalIconDanger
                    : confirmModal.type === 'warning'
                      ? styles.modalIconWarning
                      : styles.modalIconInfo,
                ]}
              >
                {confirmModal.type === 'danger' ? (
                  <Trash2 size={24} color="#FFFFFF" strokeWidth={2.4} />
                ) : confirmModal.type === 'warning' ? (
                  <AlertTriangle size={24} color="#FFFFFF" strokeWidth={2.4} />
                ) : (
                  <Sparkles size={24} color="#FFFFFF" strokeWidth={2.4} />
                )}
              </View>

              <Text style={styles.modalTitleText}>{confirmModal.title}</Text>
              <Text style={styles.modalMessageText}>{confirmModal.message}</Text>

              <View style={styles.modalActionsRow}>
                {confirmModal.cancelLabel ? (
                  <PressableScale
                    scaleTo={0.96}
                    onPress={closeConfirmModal}
                    style={[
                      styles.modalBtn,
                      confirmModal.confirmLabel ? styles.modalCancelBtn : styles.modalPrimaryBtn,
                    ]}
                  >
                    <Text
                      style={[
                        styles.modalBtnText,
                        confirmModal.confirmLabel ? styles.modalCancelBtnText : styles.modalPrimaryBtnText,
                      ]}
                    >
                      {confirmModal.cancelLabel}
                    </Text>
                  </PressableScale>
                ) : null}

                {confirmModal.confirmLabel && confirmModal.onConfirm ? (
                  <PressableScale
                    scaleTo={0.96}
                    onPress={() => {
                      const action = confirmModal.onConfirm;
                      closeConfirmModal();
                      action?.();
                    }}
                    style={[styles.modalBtn, styles.modalDangerBtn]}
                  >
                    <Text style={[styles.modalBtnText, styles.modalDangerBtnText]}>
                      {confirmModal.confirmLabel}
                    </Text>
                  </PressableScale>
                ) : null}
              </View>
            </View>
          </View>
        </Modal>
      )}
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
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  headerTitleContainer: {
    flex: 1,
    gap: 3,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  countPill: {
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : '#F3F4F6',
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.radius.pill,
  },
  countPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  newProjectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.primary,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: theme.radius.pill,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: theme.isDark ? 0.3 : 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  newProjectButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.onPrimary,
  },
  list: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: 120,
  },
  separator: {
    height: 12,
  },
  cardWrapper: {
    borderRadius: 18,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: theme.isDark ? 0.35 : 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  card: {
    backgroundColor: theme.isDark ? 'rgba(22, 24, 29, 0.72)' : 'rgba(255, 255, 255, 0.80)',
    borderRadius: 18,
    borderWidth: 1,
    borderTopColor: theme.isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(255, 255, 255, 0.95)',
    borderBottomColor: theme.isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(203, 213, 225, 0.65)',
    borderLeftColor: theme.isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(226, 232, 240, 0.8)',
    borderRightColor: theme.isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(226, 232, 240, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  cardActive: {
    borderColor: theme.colors.primary,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    backgroundColor: theme.isDark ? 'rgba(30, 34, 42, 0.85)' : 'rgba(255, 255, 255, 0.92)',
  },
  cardGlassTint: {
    ...RNStyleSheet.absoluteFill,
    backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.15)',
  },
  glassTopShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(255, 255, 255, 0.85)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  groupAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupAvatarActive: {
    backgroundColor: theme.colors.primaryMuted,
  },
  nameGroup: {
    flex: 1,
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    letterSpacing: -0.2,
  },
  activeDotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.isDark ? 'rgba(34, 197, 94, 0.15)' : '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: theme.radius.pill,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  activeDotText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#15803D',
  },
  metaSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '400',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 8,
  },
  ghostActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostDeleteBtn: {
    backgroundColor: theme.isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
  },
  spentCol: {
    gap: 1,
  },
  spentLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  spentValue: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
  },
  balanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
  },
  badgeOwed: {
    backgroundColor: theme.isDark ? 'rgba(34, 197, 94, 0.12)' : '#ECFDF5',
    borderColor: theme.isDark ? 'rgba(34, 197, 94, 0.25)' : '#A7F3D0',
  },
  badgeOwe: {
    backgroundColor: theme.isDark ? 'rgba(239, 68, 68, 0.12)' : '#FFF1F2',
    borderColor: theme.isDark ? 'rgba(239, 68, 68, 0.25)' : '#FECDD3',
  },
  badgeSettled: {
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
    borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
  },
  balanceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  balanceTextSuccess: {
    color: theme.isDark ? '#4ADE80' : '#059669',
  },
  balanceTextDanger: {
    color: theme.isDark ? '#F87171' : '#E11D48',
  },
  balanceTextMuted: {
    color: theme.colors.textSecondary,
  },
  /* Custom Modal styles */
  modalBackdrop: {
    ...RNStyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.70)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    zIndex: 999,
  },
  modalDismissArea: {
    ...RNStyleSheet.absoluteFill,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: theme.colors.card,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    paddingHorizontal: 22,
    paddingVertical: 24,
    alignItems: 'center',
    ...theme.shadows.md,
  },
  modalIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalIconDanger: {
    backgroundColor: '#DC2626',
  },
  modalIconWarning: {
    backgroundColor: '#D97706',
  },
  modalIconInfo: {
    backgroundColor: theme.colors.primary,
  },
  modalTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalMessageText: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 22,
  },
  modalActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  modalBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryBtn: {
    backgroundColor: theme.colors.primary,
  },
  modalCancelBtn: {
    backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalDangerBtn: {
    backgroundColor: '#DC2626',
  },
  modalBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  modalPrimaryBtnText: {
    color: theme.colors.onPrimary,
  },
  modalCancelBtnText: {
    color: theme.colors.text,
  },
  modalDangerBtnText: {
    color: '#FFFFFF',
  },
}));
