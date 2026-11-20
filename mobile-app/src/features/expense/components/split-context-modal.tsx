import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, Users, X } from 'lucide-react-native';
import {
  Dimensions,
  Keyboard,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  type ScrollViewInstance,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native-unistyles';

import { useFormatters } from '@/shared/hooks/use-formatters';
import { haptics } from '@/shared/lib/haptics';
import { BPS_TOTAL } from '@/shared/lib/settlement';
import type { Member, SplitType } from '@/shared/types/bonton';
import {
  Avatar,
  BottomSheetModal,
  Button,
  PressableScale,
  SegmentedControl,
  Text,
  type SegmentOption,
} from '@/shared/ui';

import { AmountDiff } from './amount-diff';
import { MemberAmountRow } from './member-amount-row';
import { PersonalBillsSection } from './personal-bills-section';
import {
  setMemberText,
  switchSplitType,
  toggleParticipant,
  type ExpenseFormState,
  type FormAnalysis,
} from '../expense-form';

const SPLIT_TYPES: readonly SplitType[] = ['equal', 'percentage', 'custom'] as const;

export interface SplitContextModalProps {
  visible: boolean;
  onClose: () => void;
  form: ExpenseFormState;
  members: readonly Member[];
  analysis: FormAnalysis;
  onChange: (updater: (form: ExpenseFormState) => ExpenseFormState) => void;
}

export function SplitContextModal({
  visible,
  onClose,
  form,
  members,
  analysis,
  onChange,
}: SplitContextModalProps) {
  const { t } = useTranslation();
  const fmt = useFormatters();

  const pagerRef = useRef<ScrollViewInstance>(null);
  const [pageWidth, setPageWidth] = useState(() => {
    const { width } = Dimensions.get('window');
    return Math.max(width - 48, 300);
  });

  const handleLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const { width } = e.nativeEvent.layout;
      if (width > 0 && Math.abs(width - pageWidth) > 1) {
        setPageWidth(width);
      }
    },
    [pageWidth],
  );

  // Sync horizontal pager position on modal open or width adjustment
  useEffect(() => {
    if (visible && pageWidth > 0) {
      const targetIndex = SPLIT_TYPES.indexOf(form.splitType);
      if (targetIndex >= 0) {
        pagerRef.current?.scrollTo({ x: targetIndex * pageWidth, animated: false });
      }
    }
  }, [visible, pageWidth]);

  const options = useMemo<ReadonlyArray<SegmentOption<SplitType>>>(
    () => [
      { value: 'equal', label: t('expense.splitEqual', 'সমান') },
      { value: 'percentage', label: t('expense.splitPercentage', 'শতাংশ') },
      { value: 'custom', label: t('expense.splitCustom', 'নির্দিষ্ট') },
    ],
    [t],
  );

  // Handle segmented control tab press
  const handleTabPress = useCallback(
    (next: SplitType) => {
      if (next === form.splitType) return;
      const targetIndex = SPLIT_TYPES.indexOf(next);
      if (targetIndex >= 0 && pageWidth > 0) {
        pagerRef.current?.scrollTo({ x: targetIndex * pageWidth, animated: true });
      }
      onChange((f) => switchSplitType(f, members, next));
    },
    [form.splitType, members, onChange, pageWidth],
  );

  // Handle horizontal swipe snapping
  const handleScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (pageWidth <= 0) return;
      const x = e.nativeEvent.contentOffset.x;
      const newIndex = Math.max(
        0,
        Math.min(SPLIT_TYPES.length - 1, Math.round(x / pageWidth)),
      );
      const targetType = SPLIT_TYPES[newIndex];
      if (targetType && targetType !== form.splitType) {
        haptics.select();
        onChange((f) => switchSplitType(f, members, targetType));
      }
    },
    [pageWidth, form.splitType, members, onChange],
  );

  const participantCount = members.filter((m) => form.participants[m.id]).length;
  const equalSharePerPerson =
    participantCount > 0 && analysis.shared > 0
      ? Math.round(analysis.shared / participantCount)
      : 0;

  return (
    <BottomSheetModal visible={visible} onClose={onClose} height="82%" maxHeight="85%">
      <View style={styles.container} onLayout={handleLayout}>
        {/* Pinned Modal Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Users size={20} color="#6B7280" />
            <Text style={styles.title}>
              {t('expense.splitLabel', 'ভাগের ধরন')}
            </Text>
          </View>
          <PressableScale scaleTo={0.9} onPress={onClose} style={styles.closeBtn}>
            <X size={20} color="#6B7280" />
          </PressableScale>
        </View>

        {/* Pinned Tab Selector */}
        <View style={styles.tabSection}>
          <Text style={styles.sectionLabel}>{t('expense.splitLabel', 'ভাগের ধরন')}</Text>
          <SegmentedControl
            options={options}
            value={form.splitType}
            onChange={handleTabPress}
          />
        </View>

        {/* Horizontal Swipeable Pager */}
        <View style={styles.pagerWrapper}>
          <ScrollView
            ref={pagerRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            bounces={false}
            directionalLockEnabled
            keyboardShouldPersistTaps="handled"
            onScrollBeginDrag={() => Keyboard.dismiss()}
            onMomentumScrollEnd={handleScrollEnd}
            onScrollEndDrag={handleScrollEnd}
            scrollEventThrottle={16}
            style={styles.pager}
          >
            {/* PAGE 0: সমান (Equal) */}
            <View style={{ width: pageWidth }}>
              <ScrollView
                style={styles.pageScroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
              >
                <View style={styles.section}>
                  <View style={styles.sectionHeaderBetween}>
                    <Text style={styles.sectionLabel}>
                      {t('expense.splitBetween', 'যাদের মধ্যে ভাগ হবে')} ({participantCount}/{members.length})
                    </Text>
                    {equalSharePerPerson > 0 ? (
                      <Text style={styles.shareBadge}>
                        জনপ্রতি: {fmt.money(equalSharePerPerson)}
                      </Text>
                    ) : null}
                  </View>

                  <View style={styles.memberList}>
                    {members.map((member) => {
                      const isSelected = Boolean(form.participants[member.id]);

                      return (
                        <PressableScale
                          key={member.id}
                          scaleTo={0.97}
                          onPress={() => onChange((f) => toggleParticipant(f, member.id))}
                          style={[
                            styles.memberToggleRow,
                            isSelected && styles.memberToggleRowSelected,
                          ]}
                        >
                          <View style={styles.memberInfoRow}>
                            <Avatar name={member.name} size={36} />
                            <Text style={styles.memberNameText}>
                              {fmt.memberName(member)}
                            </Text>
                          </View>

                          <View
                            style={[
                              styles.checkCircle,
                              isSelected && styles.checkCircleSelected,
                            ]}
                          >
                            {isSelected ? <Check size={16} color="#FFFFFF" strokeWidth={3} /> : null}
                          </View>
                        </PressableScale>
                      );
                    })}
                  </View>
                </View>

                {/* Personal Bills Section */}
                <View style={styles.section}>
                  <PersonalBillsSection
                    form={form}
                    members={members}
                    analysis={analysis}
                    onChange={onChange}
                  />
                </View>
              </ScrollView>
            </View>

            {/* PAGE 1: শতাংশ (Percentage) */}
            <View style={{ width: pageWidth }}>
              <ScrollView
                style={styles.pageScroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
              >
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>
                    {t('expense.splitPercentage', 'শতাংশ ভাগ')}
                  </Text>
                  <View style={styles.memberRows}>
                    {members.map((member) => (
                      <MemberAmountRow
                        key={member.id}
                        kind="percent"
                        member={member}
                        value={form.percentages[member.id] ?? ''}
                        onChangeText={(text) =>
                          onChange((f) => setMemberText(f, 'percentages', member.id, text))
                        }
                      />
                    ))}
                  </View>

                  <View style={styles.statSummaryRow}>
                    <Text
                      style={[
                        styles.statSummaryText,
                        analysis.percentTotalBps === BPS_TOTAL
                          ? styles.statSuccess
                          : styles.statWarning,
                      ]}
                    >
                      {t('expense.percentTotal', {
                        value: fmt.bps(analysis.percentTotalBps),
                      })}
                    </Text>
                  </View>
                  {analysis.percentTotalBps > 0 && analysis.percentTotalBps !== BPS_TOTAL ? (
                    <Text style={styles.hintText}>
                      {t('expense.percentNormalized')}
                    </Text>
                  ) : null}
                </View>

                {/* Personal Bills Section */}
                <View style={styles.section}>
                  <PersonalBillsSection
                    form={form}
                    members={members}
                    analysis={analysis}
                    onChange={onChange}
                  />
                </View>
              </ScrollView>
            </View>

            {/* PAGE 2: নির্দিষ্ট (Custom) */}
            <View style={{ width: pageWidth }}>
              <ScrollView
                style={styles.pageScroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
              >
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>
                    {t('expense.splitCustom', 'নির্দিষ্ট পরিমাণ')}
                  </Text>
                  <View style={styles.memberRows}>
                    {members.map((member) => (
                      <MemberAmountRow
                        key={member.id}
                        kind="money"
                        member={member}
                        value={form.customAmounts[member.id] ?? ''}
                        onChangeText={(text) =>
                          onChange((f) => setMemberText(f, 'customAmounts', member.id, text))
                        }
                      />
                    ))}
                  </View>

                  {analysis.shared > 0 ? (
                    <View style={styles.diffWrapper}>
                      <AmountDiff diff={analysis.shared - analysis.customTotal} />
                    </View>
                  ) : null}
                </View>

                {/* Personal Bills Section */}
                <View style={styles.section}>
                  <PersonalBillsSection
                    form={form}
                    members={members}
                    analysis={analysis}
                    onChange={onChange}
                  />
                </View>
              </ScrollView>
            </View>
          </ScrollView>
        </View>

        {/* Pinned Done Button */}
        <View style={styles.footer}>
          <Button label={t('common.done', 'সম্পন্ন')} fullWidth onPress={onClose} />
        </View>
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
  },
  tabSection: {
    paddingTop: 12,
    paddingBottom: 12,
    gap: 8,
  },
  pagerWrapper: {
    flex: 1,
    overflow: 'hidden',
  },
  pager: {
    flex: 1,
  },
  pageScroll: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 4,
    gap: 16,
    paddingBottom: 16,
  },
  section: {
    gap: 8,
  },
  sectionHeaderBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
  },
  shareBadge: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  memberList: {
    gap: 8,
  },
  memberToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: theme.isDark ? theme.colors.card : '#F9FAFB',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  memberToggleRowSelected: {
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : theme.colors.primaryMuted,
    borderColor: theme.colors.primary,
  },
  memberInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  memberNameText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  memberRows: {
    gap: 10,
  },
  statSummaryRow: {
    marginTop: 4,
  },
  statSummaryText: {
    fontSize: 13,
    fontWeight: '700',
  },
  statSuccess: {
    color: theme.colors.success,
  },
  statWarning: {
    color: theme.colors.warning,
  },
  hintText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 16,
  },
  diffWrapper: {
    marginTop: 6,
  },
  footer: {
    paddingTop: 12,
  },
}));
