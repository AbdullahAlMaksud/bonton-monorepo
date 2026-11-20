import {
  AlertCircle,
  ArrowLeft,
  Settings,
  Trash2,
  User,
  Users,
} from 'lucide-react-native';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native-unistyles';

import { useFormatters } from '@/shared/hooks/use-formatters';
import { haptics } from '@/shared/lib/haptics';
import {
  CURRENCIES,
  minorToInputString,
  parseMinorUnits,
  toBengaliDigits,
} from '@/shared/lib/money';
import type { SplitIssue } from '@/shared/lib/settlement';
import { useBontonStore, type ExpenseError } from '@/shared/store/bonton-store';
import type { Expense, Group } from '@/shared/types/bonton';
import { PressableScale, Text } from '@/shared/ui';

import {
  analyzeForm,
  createInitialForm,
  type ExpenseFormState,
} from '../expense-form';
import {
  evaluateExpression,
  handleBackspace,
  handleKeypadPress,
} from '../lib/calculator';
import { AmountDisplay, CalculatorKeypad } from './calculator-keypad';
import { SplitContextModal } from './split-context-modal';

export interface ExpenseFormViewProps {
  group: Group;
  /** Present when editing an existing expense. */
  expense?: Expense;
}

export function ExpenseFormView({ group, expense }: ExpenseFormViewProps) {
  const { t, i18n } = useTranslation();
  const isBn = i18n.language === 'bn';
  const insets = useSafeAreaInsets();
  const fmt = useFormatters();

  const defaultSplitType = useBontonStore((s) => s.defaultSplitType);
  const addExpense = useBontonStore((s) => s.addExpense);
  const updateExpense = useBontonStore((s) => s.updateExpense);
  const deleteExpense = useBontonStore((s) => s.deleteExpense);
  const currencyCode = useBontonStore((s) => s.currency);

  const currencySymbol = CURRENCIES[currencyCode]?.symbol ?? '৳';

  const isEditing = expense !== undefined;
  const members = group.members;
  const initialSplitType = group.defaultSplitType ?? defaultSplitType;

  const [form, setForm] = useState<ExpenseFormState>(() =>
    createInitialForm(members, expense, initialSplitType),
  );

  const initialPayerId = form.payerId || members.find((m) => m.isMe)?.id || members[0]?.id || '';
  const [focusedMemberId, setFocusedMemberId] = useState<string>(initialPayerId);

  // Expression displayed in the calculator box
  const [calculatorExpression, setCalculatorExpression] = useState<string>(() => {
    if (form.multiplePayers) {
      return form.payerAmounts[initialPayerId] || '';
    }
    return form.amount || '';
  });

  const [splitModalVisible, setSplitModalVisible] = useState(false);
  const handleCloseSplitModal = useCallback(() => {
    setSplitModalVisible(false);
  }, []);
  const [submitted, setSubmitted] = useState(false);

  // Floating Confirmation Toast for Payer Mode
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastIcon, setToastIcon] = useState<'single' | 'multiple'>('single');
  const toastOpacity = useSharedValue(0);
  const toastTranslateY = useSharedValue(-12);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const showToast = (mode: 'single' | 'multiple') => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToastIcon(mode);
    const msg = mode === 'single'
      ? (isBn ? '১ জন দিয়েছেন (সিঙ্গেল) মোড চালু হয়েছে' : 'Single Payer mode selected')
      : (isBn ? 'একাধিক জন দিয়েছেন (মাল্টিপল) মোড চালু হয়েছে' : 'Multiple Payers mode selected');
    setToastMessage(msg);

    toastOpacity.value = withTiming(1, { duration: 180 });
    toastTranslateY.value = withSpring(0, { damping: 14, stiffness: 160 });

    toastTimerRef.current = setTimeout(() => {
      toastOpacity.value = withTiming(0, { duration: 220 });
      toastTranslateY.value = withTiming(-10, { duration: 220 });
    }, 2000);
  };

  const toastAnimatedStyle = useAnimatedStyle(() => ({
    opacity: toastOpacity.value,
    transform: [{ translateY: toastTranslateY.value }],
  }));

  const analysis = useMemo(() => analyzeForm(form, members), [form, members]);

  const titleError = submitted && form.title.trim() === '' ? t('expense.titleRequired') : null;
  const issue: SplitIssue | null = analysis.result.ok ? null : analysis.result.issue;
  const showIssue = issue !== null && (submitted || analysis.amount > 0);

  const issueDiff = issue
    ? issue.code === 'payers_mismatch' ||
      issue.code === 'custom_mismatch' ||
      issue.code === 'personal_exceeds_total'
      ? issue.diff
      : 0
    : 0;

  // --- Keypad Handlers ---
  const handleKeypadAction = (key: string) => {
    Keyboard.dismiss();
    const nextExpr = handleKeypadPress(calculatorExpression, key);
    setCalculatorExpression(nextExpr);
    const evaluated = evaluateExpression(nextExpr);

    if (!form.multiplePayers) {
      setForm((f) => ({ ...f, amount: evaluated }));
    } else {
      setForm((f) => {
        const nextPayerAmounts = { ...f.payerAmounts, [focusedMemberId]: evaluated };
        const totalMinor = members.reduce((acc, m) => {
          const val = parseMinorUnits(nextPayerAmounts[m.id] ?? '');
          return acc + (val ?? 0);
        }, 0);
        return {
          ...f,
          payerAmounts: nextPayerAmounts,
          amount: totalMinor > 0 ? minorToInputString(totalMinor) : '',
        };
      });
    }
  };

  const handleBackspaceAction = () => {
    Keyboard.dismiss();
    const nextExpr = handleBackspace(calculatorExpression);
    setCalculatorExpression(nextExpr);
    const evaluated = evaluateExpression(nextExpr);

    if (!form.multiplePayers) {
      setForm((f) => ({ ...f, amount: evaluated }));
    } else {
      setForm((f) => {
        const nextPayerAmounts = { ...f.payerAmounts, [focusedMemberId]: evaluated };
        const totalMinor = members.reduce((acc, m) => {
          const val = parseMinorUnits(nextPayerAmounts[m.id] ?? '');
          return acc + (val ?? 0);
        }, 0);
        return {
          ...f,
          payerAmounts: nextPayerAmounts,
          amount: totalMinor > 0 ? minorToInputString(totalMinor) : '',
        };
      });
    }
  };

  const handleClearAction = () => {
    Keyboard.dismiss();
    setCalculatorExpression('');
    if (!form.multiplePayers) {
      setForm((f) => ({ ...f, amount: '' }));
    } else {
      setForm((f) => {
        const nextPayerAmounts = { ...f.payerAmounts, [focusedMemberId]: '' };
        const totalMinor = members.reduce((acc, m) => {
          const val = parseMinorUnits(nextPayerAmounts[m.id] ?? '');
          return acc + (val ?? 0);
        }, 0);
        return {
          ...f,
          payerAmounts: nextPayerAmounts,
          amount: totalMinor > 0 ? minorToInputString(totalMinor) : '',
        };
      });
    }
  };

  // --- Variant Switching (Single vs Multiple) ---
  const switchPayerVariant = (variant: 'single' | 'multiple') => {
    haptics.select();
    showToast(variant);
    if (variant === 'single') {
      setForm((f) => ({ ...f, multiplePayers: false }));
      setCalculatorExpression(form.amount || '');
    } else {
      setForm((f) => {
        const currentAmount = form.amount;
        const nextPayerAmounts = { ...f.payerAmounts };
        const hasExisting = Object.values(nextPayerAmounts).some((v) => v !== '');
        if (currentAmount && !hasExisting) {
          nextPayerAmounts[f.payerId || focusedMemberId] = currentAmount;
        }
        return { ...f, multiplePayers: true, payerAmounts: nextPayerAmounts };
      });
      setCalculatorExpression(form.payerAmounts[focusedMemberId] || form.amount || '');
    }
  };

  const selectSinglePayer = (memberId: string) => {
    haptics.tap();
    setForm((f) => ({ ...f, payerId: memberId }));
    setFocusedMemberId(memberId);
  };

  const selectMultiplePayerFocus = (memberId: string) => {
    haptics.tap();
    setFocusedMemberId(memberId);
    setCalculatorExpression(form.payerAmounts[memberId] || '');
  };

  // --- Dynamic Summary Labels for Center Preview ---
  const selectedPayer = members.find((m) => m.id === (form.payerId || initialPayerId));
  const selectedPayerName = selectedPayer ? fmt.memberName(selectedPayer) : '';

  const activePayersCount = members.filter((m) => {
    const val = parseMinorUnits(form.payerAmounts[m.id] ?? '');
    return (val ?? 0) > 0;
  }).length || 1;

  const currentTotalAmount = form.multiplePayers
    ? (analysis.amount > 0 ? minorToInputString(analysis.amount) : '0')
    : (evaluateExpression(calculatorExpression) || '0');

  const displayAmount = isBn ? toBengaliDigits(currentTotalAmount) : currentTotalAmount;

  const splitMethodLabel = useMemo(() => {
    switch (form.splitType) {
      case 'equal': {
        const count = members.filter((m) => form.participants[m.id]).length;
        if (count === members.length) {
          return isBn ? 'সবার মাঝে সমান' : 'Equally';
        }
        return isBn ? `সমান ভাগ (${toBengaliDigits(count)} জন)` : `Equal (${count} members)`;
      }
      case 'percentage':
        return isBn ? 'শতাংশ অনুযায়ী' : 'By Percentage';
      case 'custom':
        return isBn ? 'নির্দিষ্ট টাকা' : 'Custom Shares';
    }
  }, [form.splitType, form.participants, members.length, isBn]);

  const describeStoreError = (error: ExpenseError): string => {
    switch (error.kind) {
      case 'title_required':
        return t('expense.titleRequired');
      case 'split':
        return t(`expense.errors.${error.issue.code}`);
      case 'not_found':
      case 'unknown_member':
        return t('expense.noGroup');
    }
  };

  // --- Save / Delete Actions ---
  const save = () => {
    Keyboard.dismiss();
    setSubmitted(true);

    // Finalize pending math evaluation
    const evaluated = evaluateExpression(calculatorExpression);
    let finalForm = form;
    if (evaluated && evaluated !== calculatorExpression) {
      if (!form.multiplePayers) {
        finalForm = { ...form, amount: evaluated };
      } else {
        const nextPayerAmounts = { ...form.payerAmounts, [focusedMemberId]: evaluated };
        const totalMinor = members.reduce((acc, m) => {
          const val = parseMinorUnits(nextPayerAmounts[m.id] ?? '');
          return acc + (val ?? 0);
        }, 0);
        finalForm = {
          ...form,
          payerAmounts: nextPayerAmounts,
          amount: totalMinor > 0 ? minorToInputString(totalMinor) : '',
        };
      }
      setForm(finalForm);
      setCalculatorExpression(evaluated);
    }

    const finalAnalysis = analyzeForm(finalForm, members);

    if (finalForm.title.trim() === '' || !finalAnalysis.result.ok) {
      haptics.error();
      return;
    }

    const outcome = isEditing
      ? updateExpense(group.id, expense.id, finalAnalysis.input)
      : addExpense(group.id, finalAnalysis.input);

    if (outcome.ok) {
      haptics.success();
      router.back();
    } else {
      haptics.error();
      Alert.alert(describeStoreError(outcome.error));
    }
  };

  const confirmDelete = () => {
    if (!expense) return;
    haptics.warning();
    Alert.alert(t('expense.deleteTitle'), t('expense.deleteBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          deleteExpense(group.id, expense.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <View style={[styles.root, { paddingTop: Math.max(insets.top, 12), paddingBottom: Math.max(insets.bottom, 12) + 6 }]}>
      <StatusBar style="dark" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Floating Mode Confirmation Toast */}
      {toastMessage ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.toastContainer,
            { top: Math.max(insets.top, 12) + 56 },
            toastAnimatedStyle,
          ]}
        >
          {toastIcon === 'single' ? (
            <User size={15} color="#FFFFFF" strokeWidth={2.2} />
          ) : (
            <Users size={15} color="#FFFFFF" strokeWidth={2.2} />
          )}
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      ) : null}

      {/* ============================================================ */}
      {/* 1. TOP HEADER BAR: Back Arrow, Title, Single/Multi, Settings */}
      {/* ============================================================ */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <PressableScale
            scaleTo={0.9}
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={22} color="#111827" />
          </PressableScale>
          <Text style={styles.headerTitleText}>
            {isEditing ? t('expense.editTitle', 'খরচ সম্পাদনা') : t('expense.addTitle', 'খরচ যোগ করুন')}
          </Text>
        </View>

        <View style={styles.headerRight}>
          {/* Variant Toggle Square Black Button: Single / Multiple */}
          <PressableScale
            scaleTo={0.92}
            onPress={() => switchPayerVariant(form.multiplePayers ? 'single' : 'multiple')}
            style={styles.headerSquareButton}
            accessibilityRole="button"
            accessibilityLabel={form.multiplePayers ? 'Switch to single payer' : 'Switch to multiple payers'}
          >
            {form.multiplePayers ? (
              <Users size={20} color="#FFFFFF" strokeWidth={2.2} />
            ) : (
              <User size={20} color="#FFFFFF" strokeWidth={2.2} />
            )}
          </PressableScale>

          {/* Settings Square Black Button: Opens Split Context Modal (ভাগ করুন মোডাল) */}
          <PressableScale
            scaleTo={0.92}
            onPress={() => {
              haptics.tap();
              Keyboard.dismiss();
              setSplitModalVisible(true);
            }}
            style={styles.headerSquareButton}
            accessibilityRole="button"
            accessibilityLabel="Open split settings"
          >
            <Settings size={20} color="#FFFFFF" strokeWidth={2.2} />
          </PressableScale>
        </View>
      </View>

      {/* ============================================================ */}
      {/* 2. MEMBER / PAYER SELECTION PILLS ROW                        */}
      {/* ============================================================ */}
      <View style={styles.membersRowWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.membersRow}
        >
          {members.map((member) => {
            const isSelected = !form.multiplePayers
              ? member.id === (form.payerId || initialPayerId)
              : member.id === focusedMemberId;
            const paidText = form.payerAmounts[member.id];

            return (
              <PressableScale
                key={member.id}
                scaleTo={0.95}
                onPress={() => {
                  if (!form.multiplePayers) {
                    selectSinglePayer(member.id);
                  } else {
                    selectMultiplePayerFocus(member.id);
                  }
                }}
                style={[
                  styles.memberPill,
                  isSelected && styles.memberPillSelected,
                ]}
              >
                <User
                  size={15}
                  color={isSelected ? '#FFFFFF' : '#111827'}
                  strokeWidth={2.2}
                />
                <Text
                  style={[
                    styles.memberPillText,
                    isSelected && styles.memberPillTextSelected,
                  ]}
                >
                  {fmt.memberName(member)}
                  {form.multiplePayers && paidText
                    ? ` (${currencySymbol}${isBn ? toBengaliDigits(paidText) : paidText})`
                    : ''}
                </Text>
              </PressableScale>
            );
          })}
        </ScrollView>
      </View>

      {/* ============================================================ */}
      {/* SCROLLABLE BODY: Preview, Title, Amount, Keypad, Save Button */}
      {/* ============================================================ */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ============================================================ */}
        {/* 3. CENTER SUMMARY / RECEIPT PREVIEW AREA                     */}
        {/* ============================================================ */}
        <View style={styles.previewContainer}>
          {/* Line 1: Expense title babod */}
          <Text style={styles.previewTitleText}>
            {form.title.trim()
              ? `${form.title.trim()} ${isBn ? 'বাবদ' : 'for'}`
              : (isBn ? ' বাবদ' : 'Expense for')}
          </Text>

          {/* Line 2: Payer khoroch korechen */}
          <Text style={styles.previewPayerText}>
            {!form.multiplePayers
              ? `${selectedPayerName} ${isBn ? 'খরচ করেছেন' : 'paid'}`
              : `${isBn ? toBengaliDigits(activePayersCount) : activePayersCount} ${isBn ? 'জন খরচ করেছেন' : 'members paid'}`}
          </Text>

          {/* Line 3: Big Amount BDT */}
          <Text style={styles.previewAmountText}>
            {displayAmount} {currencyCode}
          </Text>

          {/* Line 4: Vag hobe subtitle */}
          <Text style={styles.previewSplitSubtext}>
            {isBn ? 'এটা বাকি মেম্বারদের মধ্যে ভাগ হবে:' : 'This will be split among members:'}
          </Text>

          {/* Line 5: Split method name (Tappable to open Split Modal) */}
          <PressableScale
            scaleTo={0.97}
            onPress={() => {
              haptics.tap();
              Keyboard.dismiss();
              setSplitModalVisible(true);
            }}
          >
            <Text style={styles.previewSplitMethodText}>
              {splitMethodLabel}
            </Text>
          </PressableScale>
        </View>

        {/* ============================================================ */}
        {/* 4. INPUTS: Title Pill & Calculator Amount Display            */}
        {/* ============================================================ */}
        <View style={styles.inputsSection}>
          {/* Title Input Pill */}
          <View style={[styles.titleInputContainer, titleError ? styles.titleInputError : null]}>
            <TextInput
              style={styles.titleTextInput}
              placeholder={isBn ? 'খরচের বিবরণ লিখুন...' : 'Write expense title....'}
              placeholderTextColor="#9CA3AF"
              value={form.title}
              onChangeText={(title) => setForm((f) => ({ ...f, title }))}
              maxLength={60}
              returnKeyType="done"
            />
          </View>
          {titleError ? <Text style={styles.titleErrorText}>{titleError}</Text> : null}

          {/* Amount Display Box */}
          <AmountDisplay
            currency={currencySymbol}
            expression={calculatorExpression}
            onBackspace={handleBackspaceAction}
            onClear={handleClearAction}
          />

          {/* 5. 4x4 Calculator Keypad */}
          <CalculatorKeypad
            onKeyPress={handleKeypadAction}
            onBackspace={handleBackspaceAction}
            onClear={handleClearAction}
          />

          {/* Validation Issue Banner */}
          {showIssue && issue ? (
            <View style={styles.issueContainer}>
              <AlertCircle size={16} color="#EF4444" />
              <Text style={styles.issueText}>
                {t(`expense.errors.${issue.code}`)}
                {issueDiff !== 0
                  ? ` ${issueDiff > 0 ? t('expense.unassigned', { amount: fmt.money(issueDiff) }) : t('expense.overBy', { amount: fmt.money(-issueDiff) })}`
                  : ''}
              </Text>
            </View>
          ) : null}

          {/* 6. Save Button at the Bottom */}
          <PressableScale
            scaleTo={0.96}
            onPress={save}
            style={styles.saveButton}
            accessibilityRole="button"
            accessibilityLabel="Save expense"
          >
            <Text style={styles.saveButtonText}>
              {isEditing ? t('expense.editSave', 'পরিবর্তন সংরক্ষণ করুন') : t('expense.save', 'খরচ সংরক্ষণ করুন')}
            </Text>
          </PressableScale>

          {isEditing ? (
            <PressableScale
              scaleTo={0.96}
              onPress={confirmDelete}
              style={styles.deleteButton}
            >
              <Trash2 size={16} color="#EF4444" />
              <Text style={styles.deleteButtonText}>{t('expense.delete', 'খরচ মুছুন')}</Text>
            </PressableScale>
          ) : null}
        </View>
      </ScrollView>

      {/* ============================================================ */}
      {/* 7. SPLIT CONFIGURATION CONTEXT MODAL (ভাগ করুন মোডাল)          */}
      {/* ============================================================ */}
      <SplitContextModal
        visible={splitModalVisible}
        onClose={handleCloseSplitModal}
        form={form}
        members={members}
        analysis={analysis}
        onChange={setForm}
      />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  /* --- Floating Toast Notification --- */
  toastContainer: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  toastText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },

  /* --- Top Header Bar --- */
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerSquareButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },

  /* --- Member Chips Row --- */
  membersRowWrapper: {
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  membersRow: {
    paddingHorizontal: 16,
    gap: 10,
    alignItems: 'center',
  },
  memberPill: {
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  memberPillSelected: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  memberPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  memberPillTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  /* --- Scroll Content --- */
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },

  /* --- Center Summary / Receipt Preview --- */
  previewContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 4,
  },
  previewTitleText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
    textAlign: 'center',
  },
  previewPayerText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
    textAlign: 'center',
  },
  previewAmountText: {
    fontSize: 34,
    color: '#111827',
    fontWeight: '800',
    textAlign: 'center',
    marginVertical: 4,
    letterSpacing: -0.5,
  },
  previewSplitSubtext: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
  },
  previewSplitMethodText: {
    fontSize: 22,
    color: '#111827',
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 2,
  },

  /* --- Inputs & Keypad Section --- */
  inputsSection: {
    gap: 10,
  },
  titleInputContainer: {
    height: 52,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  titleInputError: {
    borderColor: '#EF4444',
  },
  titleTextInput: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  titleErrorText: {
    fontSize: 12,
    color: '#EF4444',
    paddingHorizontal: 6,
    marginTop: -4,
  },

  /* --- Issue Banner --- */
  issueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  issueText: {
    fontSize: 13,
    color: '#DC2626',
    flex: 1,
  },

  /* --- Save & Delete Buttons --- */
  saveButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  deleteButtonText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
  },
}));