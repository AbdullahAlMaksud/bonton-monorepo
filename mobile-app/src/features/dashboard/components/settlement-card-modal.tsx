import { type ComponentRef, useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  View,
} from 'react-native';
import {
  ArrowRight,
  Check,
  Copy,
  Download,
  Receipt,
  Share2,
  Sparkles,
  Users,
  Wallet,
  X,
} from 'lucide-react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useTranslation } from 'react-i18next';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';

import { useFormatters } from '@/shared/hooks/use-formatters';
import { haptics } from '@/shared/lib/haptics';
import { useBontonStore } from '@/shared/store/bonton-store';
import type { Group, MemberBalance, Transfer } from '@/shared/types/bonton';
import { BottomSheetModal, PressableScale, Text } from '@/shared/ui';

export interface SettlementCardModalProps {
  visible: boolean;
  onClose: () => void;
  group: Group;
  balances: MemberBalance[];
  settlements: Transfer[];
  totalSpent: number;
}

export function SettlementCardModal({
  visible,
  onClose,
  group,
  balances,
  settlements,
  totalSpent,
}: SettlementCardModalProps) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const fmt = useFormatters();
  const userName = useBontonStore((s) => s.userName);
  const currency = useBontonStore((s) => s.currency);

  const cardRef = useRef<ComponentRef<typeof View> | null>(null);
  const viewShotRef = useRef<any>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  interface FeedbackModalState {
    visible: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
    actionLabel?: string;
    onAction?: () => void;
  }
  const [feedbackModal, setFeedbackModal] = useState<FeedbackModalState>({
    visible: false,
    type: 'success',
    title: '',
    message: '',
  });

  const membersById = new Map(group.members.map((m) => [m.id, m]));
  const memberCount = Math.max(1, group.members.length);
  const perPersonExpense = Math.round(totalSpent / memberCount);

  // Generate friendly formatted text for clipboard copying & fallback sharing
  const buildSummaryText = useCallback((): string => {
    const today = fmt.date(Date.now());
    let text = `📋 ${group.name} — হিসাব সারসংক্ষেপ\n`;
    text += `📅 ${today}\n`;
    text += `💰 মোট খরচ: ${fmt.money(totalSpent)}\n`;
    text += `👥 মোট সদস্য: ${fmt.count(group.members.length)} জন (মাথাপিছু: ${fmt.money(perPersonExpense)})\n\n`;

    text += `🤝 কে কার কাছে কতো টাকা পাবে:\n`;
    if (settlements.length === 0) {
      text += `✅ সব হিসাব পরিশোধিত! কারো কোনো দেনা-পাওনা নেই।\n`;
    } else {
      settlements.forEach((tx) => {
        const from = membersById.get(tx.from);
        const to = membersById.get(tx.to);
        const fromName = from ? (from.isMe ? userName || t('common.you') : from.name) : 'Member';
        const toName = to ? (to.isMe ? userName || t('common.you') : to.name) : 'Member';
        text += `• ${fromName} ➔ ${toName} কে ${fmt.money(tx.amount)} দিবে\n`;
      });
    }

    text += `\n📊 সদস্যভিত্তিক ব্যালেন্স:\n`;
    balances.forEach((item) => {
      const member = membersById.get(item.memberId);
      if (!member) return;
      const name = member.isMe ? `${userName || member.name} (${t('common.you')})` : member.name;
      if (item.balance > 0) {
        text += `• ${name}: +${fmt.money(item.balance)} (পাবে)\n`;
      } else if (item.balance < 0) {
        text += `• ${name}: -${fmt.money(Math.abs(item.balance))} (দিবে)\n`;
      } else {
        text += `• ${name}: ০ ${currency} (সমান)\n`;
      }
    });

    text += `\n✨ বণ্টন (Bonton) অ্যাপের মাধ্যমে প্রস্তুতকৃত`;
    return text;
  }, [balances, currency, fmt, group, membersById, perPersonExpense, settlements, t, totalSpent, userName]);

  // Capture Card to Image URI
  const captureCardImage = async (): Promise<string | null> => {
    try {
      if (viewShotRef.current && typeof (viewShotRef.current as any).capture === 'function') {
        return await (viewShotRef.current as any).capture();
      }
      if (cardRef.current) {
        return await captureRef(cardRef as any, {
          format: 'png',
          quality: 1.0,
          result: 'tmpfile',
        });
      }
    } catch (e) {
      console.warn('captureCardImage failed:', e);
    }
    return null;
  };

  // Handle Download Image Card
  const handleDownload = async () => {
    if (isDownloading) return;
    try {
      haptics.tap();
      setIsDownloading(true);

      const uri = await captureCardImage();
      if (!uri) {
        setFeedbackModal({
          visible: true,
          type: 'error',
          title: t('common.error', 'ত্রুটি'),
          message: t('home.settlementCard.downloadError', 'কার্ডটি তৈরি করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'),
        });
        return;
      }

      // Try saving to Media Library
      try {
        const { status } = await MediaLibrary.requestPermissionsAsync(true);
        if (status === 'granted') {
          await MediaLibrary.saveToLibraryAsync(uri);
          haptics.success();
          setFeedbackModal({
            visible: true,
            type: 'success',
            title: t('common.save', 'সংরক্ষণ সফল!'),
            message: t('home.settlementCard.downloadSuccess', 'কার্ডটি সফলভাবে আপনার গ্যালারিতে সংরক্ষিত হয়েছে!'),
          });
          return;
        }
      } catch (saveError) {
        console.warn('MediaLibrary save failed, falling back to Sharing:', saveError);
      }

      // Fallback: share sheet so user can save image from there directly
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: `${group.name} - হিসাব কার্ড সংরক্ষণ`,
        });
      } else {
        setFeedbackModal({
          visible: true,
          type: 'info',
          title: t('common.notice', 'অনুমতি প্রয়োজন'),
          message: 'গ্যালারিতে কার্ডটি সরাসরি সেভ করতে ফটো পারমিশন প্রয়োজন। অনুগ্রহ করে পারমিশন দিন।',
        });
      }
    } catch (error) {
      console.warn('Error downloading settlement card:', error);
      setFeedbackModal({
        visible: true,
        type: 'error',
        title: t('common.error', 'ত্রুটি'),
        message: t('home.settlementCard.downloadError', 'কার্ডটি সেভ করতে সমস্যা হয়েছে। অনুগ্রহ করে শেয়ার অপশন ব্যবহার করুন।'),
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle Copy text
  const handleCopy = async () => {
    try {
      haptics.tap();
      const summaryText = buildSummaryText();
      await Clipboard.setStringAsync(summaryText);
      setIsCopied(true);
      haptics.success();
      setTimeout(() => setIsCopied(false), 2500);
      setFeedbackModal({
        visible: true,
        type: 'success',
        title: t('home.settlementCard.copied', 'কপি সম্পন্ন!'),
        message: t('home.settlementCard.copySuccess', 'হিসাবের পুরো বিবরণ ক্লিপবোর্ডে কপি করা হয়েছে!'),
      });
    } catch (error) {
      console.warn('Error copying summary:', error);
      setFeedbackModal({
        visible: true,
        type: 'error',
        title: t('common.error', 'ত্রুটি'),
        message: 'ক্লিপবোর্ডে কপি করতে সমস্যা হয়েছে।',
      });
    }
  };

  // Handle Share Image / Text
  const handleShare = async () => {
    if (isSharing) return;
    try {
      haptics.tap();
      setIsSharing(true);

      const uri = await captureCardImage();
      if (uri) {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: `${group.name} - হিসাব কার্ড`,
          });
          haptics.success();
          return;
        }
      }

      // Fallback to text share
      const summaryText = buildSummaryText();
      await Share.share({
        message: summaryText,
        title: group.name,
      });
      haptics.success();
    } catch (error) {
      console.warn('Error sharing settlement card:', error);
      try {
        const summaryText = buildSummaryText();
        await Share.share({
          message: summaryText,
          title: group.name,
        });
      } catch {
        setFeedbackModal({
          visible: true,
          type: 'error',
          title: t('common.error', 'ত্রুটি'),
          message: t('home.settlementCard.shareError', 'শেয়ার করতে সমস্যা হয়েছে।'),
        });
      }
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <BottomSheetModal visible={visible} onClose={onClose} maxHeight="92%">
      {/* Modal Header */}
      <View style={styles.modalHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconContainer}>
            <Receipt size={22} color={theme.colors.primary} />
          </View>
          <View style={styles.headerTextGroup}>
            <Text variant="heading" style={styles.modalTitle}>
              {t('home.settlementCard.modalTitle', 'হিসাব ও দেনা-পাওনা কার্ড')}
            </Text>
            <Text variant="caption" tone="secondary">
              {t('home.settlementCard.modalSubtitle', 'কে কার কাছে কতো টাকা পাবে তার ফটো কার্ড')}
            </Text>
          </View>
        </View>

        <PressableScale
          scaleTo={0.9}
          onPress={onClose}
          style={styles.closeButton}
          accessibilityLabel={t('common.close', 'Close')}
        >
          <X size={20} color={theme.colors.textSecondary} />
        </PressableScale>
      </View>

      {/* Scrollable Card Preview */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ============================================================ */}
        {/* THE CAPTURABLE PHOTO CARD CONTAINER                          */}
        {/* ============================================================ */}
        <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1.0 }} style={{ width: '100%' }}>
          <View ref={cardRef} collapsable={false} style={styles.cardContainer}>
            {/* Card Top Banner */}
            <View style={styles.cardHeaderBanner}>
              <View style={styles.cardTopBadgeRow}>
                <View style={styles.appBrandPill}>
                  <Sparkles size={13} color="#FFFFFF" />
                  <Text style={styles.appBrandText}>বণ্টন • BONTON</Text>
                </View>
                <View style={styles.datePill}>
                  <Text style={styles.datePillText}>{fmt.date(Date.now())}</Text>
                </View>
              </View>

              <Text style={styles.cardProjectTitle} numberOfLines={2}>
                {group.name}
              </Text>

              <Text style={styles.cardSubtitle}>
                {t('home.settlementCard.cardHeaderTitle', 'হিসাব ও লেনদেন বিবরণী')}
              </Text>
            </View>

          {/* Card Financial Metrics Bar */}
          <View style={styles.cardMetricsBar}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>
                {t('home.settlementCard.totalExpense', 'মোট খরচ')}
              </Text>
              <Text style={styles.metricValue}>
                {fmt.money(totalSpent)}
              </Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>
                {t('home.settlementCard.totalMembers', 'মোট সদস্য')}
              </Text>
              <Text style={styles.metricValue}>
                {fmt.count(group.members.length)} জন
              </Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>
                {t('home.settlementCard.perPersonShare', 'মাথাপিছু খরচ')}
              </Text>
              <Text style={styles.metricValue}>
                {fmt.money(perPersonExpense)}
              </Text>
            </View>
          </View>

          {/* Card Section 1: Who Owes Whom How Much */}
          <View style={styles.cardSection}>
            <View style={styles.cardSectionHeader}>
              <Wallet size={16} color={theme.colors.primary} />
              <Text style={styles.cardSectionTitle}>
                {t('home.settlementCard.whoOwesWhom', 'কে কার কাছে কতো টাকা পাবে')}
              </Text>
            </View>

            {settlements.length === 0 ? (
              <View style={styles.settledBanner}>
                <Check size={18} color="#16A34A" strokeWidth={2.5} />
                <Text style={styles.settledBannerText}>
                  {t('home.settlementCard.allSettled', 'সব হিসাব পরিশোধিত! কারো কোনো দেনা-পাওনা নেই।')}
                </Text>
              </View>
            ) : (
              <View style={styles.settlementList}>
                {settlements.map((tx, idx) => {
                  const fromMember = membersById.get(tx.from);
                  const toMember = membersById.get(tx.to);
                  const fromName = fromMember
                    ? fromMember.isMe
                      ? userName || t('common.you')
                      : fromMember.name
                    : 'Member';
                  const toName = toMember
                    ? toMember.isMe
                      ? userName || t('common.you')
                      : toMember.name
                    : 'Member';

                  return (
                    <View key={`${tx.from}-${tx.to}-${idx}`} style={styles.settlementItemBox}>
                      <View style={styles.settlementMembersRow}>
                        <View style={styles.memberBadge}>
                          <Text style={styles.memberBadgeText} numberOfLines={1}>
                            {fromName}
                          </Text>
                        </View>
                        <View style={styles.transferArrowBox}>
                          <Text style={styles.paysText}>
                            {t('home.settlementCard.pays', 'দিবে')}
                          </Text>
                          <ArrowRight size={13} color="#6B7280" strokeWidth={2.5} />
                        </View>
                        <View style={styles.memberBadge}>
                          <Text style={styles.memberBadgeText} numberOfLines={1}>
                            {toName}
                          </Text>
                        </View>
                        <View style={styles.amountPill}>
                          <Text style={styles.amountPillText}>
                            {fmt.money(tx.amount)}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.settlementSentence}>
                        👉 {fromName} {toName} কে {fmt.money(tx.amount)} দিবে
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* Card Section 2: Member Net Balances */}
          <View style={styles.cardSection}>
            <View style={styles.cardSectionHeader}>
              <Users size={16} color={theme.colors.primary} />
              <Text style={styles.cardSectionTitle}>
                {t('home.settlementCard.memberBalances', 'সদস্যভিত্তিক ব্যালেন্স')}
              </Text>
            </View>

            <View style={styles.balanceList}>
              {balances.map((item) => {
                const member = membersById.get(item.memberId);
                if (!member) return null;
                const name = member.isMe
                  ? `${userName || member.name} (${t('common.you')})`
                  : member.name;
                const isPositive = item.balance > 0;
                const isNegative = item.balance < 0;

                return (
                  <View key={item.memberId} style={styles.balanceRow}>
                    <View style={styles.balanceMemberInfo}>
                      <View style={styles.balanceMemberAvatar}>
                        <Text style={styles.balanceMemberInitial}>
                          {(member.name || 'U').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.balanceMemberName} numberOfLines={1}>
                        {name}
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.balanceStatusValue,
                        isPositive && styles.balancePositive,
                        isNegative && styles.balanceNegative,
                      ]}
                    >
                      {isPositive
                        ? `+${fmt.money(item.balance)} (${t('home.settlementCard.getsBack', 'পাবে')})`
                        : isNegative
                          ? `-${fmt.money(Math.abs(item.balance))} (${t('home.settlementCard.owes', 'দিবে')})`
                          : `০ ${currency} (${t('home.settlementCard.settled', 'সমান')})`}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Card Footer Watermark */}
          <View style={styles.cardFooter}>
            <View style={styles.footerDivider} />
            <View style={styles.cardFooterRow}>
              <Text style={styles.watermarkText}>
                {t('home.settlementCard.watermark', 'বণ্টন (Bonton) • স্মার্ট হিসাব ও স্প্লিট')}
              </Text>
              <Text style={styles.footerSubText}>
                ১০০% নির্ভুল হিসাব
              </Text>
            </View>
          </View>
        </View>
      </ViewShot>
    </ScrollView>

      {/* ============================================================ */}
      {/* MODAL ACTION BUTTONS BAR: DOWNLOAD, COPY, SHARE               */}
      {/* ============================================================ */}
      <View style={styles.actionsBar}>
        {/* Button 1: Download */}
        <PressableScale
          scaleTo={0.95}
          onPress={handleDownload}
          disabled={isDownloading}
          style={[styles.actionBtn, styles.downloadBtn]}
          accessibilityLabel={t('home.settlementCard.download', 'ডাউনলোড')}
        >
          {isDownloading ? (
            <ActivityIndicator size="small" color={theme.colors.primaryText} />
          ) : (
            <Download size={18} color={theme.colors.primaryText} strokeWidth={2.4} />
          )}
          <Text style={styles.actionBtnText}>
            {t('home.settlementCard.download', 'ডাউনলোড')}
          </Text>
        </PressableScale>

        {/* Button 2: Copy */}
        <PressableScale
          scaleTo={0.95}
          onPress={handleCopy}
          style={[styles.actionBtn, styles.copyBtn]}
          accessibilityLabel={t('home.settlementCard.copy', 'কপি করুন')}
        >
          {isCopied ? (
            <Check size={18} color="#16A34A" strokeWidth={2.6} />
          ) : (
            <Copy size={18} color={theme.colors.primaryText} strokeWidth={2.4} />
          )}
          <Text style={[styles.actionBtnText, isCopied && styles.copiedText]}>
            {isCopied
              ? t('home.settlementCard.copied', 'কপি হয়েছে!')
              : t('home.settlementCard.copy', 'কপি করুন')}
          </Text>
        </PressableScale>

        {/* Button 3: Share */}
        <PressableScale
          scaleTo={0.95}
          onPress={handleShare}
          disabled={isSharing}
          style={[styles.actionBtn, styles.shareBtn]}
          accessibilityLabel={t('home.settlementCard.share', 'শেয়ার করুন')}
        >
          {isSharing ? (
            <ActivityIndicator size="small" color={theme.colors.onPrimary} />
          ) : (
            <Share2 size={18} color={theme.colors.onPrimary} strokeWidth={2.4} />
          )}
          <Text style={styles.shareBtnText}>
            {t('home.settlementCard.share', 'শেয়ার করুন')}
          </Text>
        </PressableScale>
      </View>

      {/* Custom In-App Feedback Modal */}
      {feedbackModal.visible && (
        <Modal
          visible={feedbackModal.visible}
          transparent
          statusBarTranslucent
          animationType="fade"
          onRequestClose={() => setFeedbackModal((prev) => ({ ...prev, visible: false }))}
        >
          <View style={styles.modalBackdrop}>
            <Pressable
              style={styles.modalDismissArea}
              onPress={() => setFeedbackModal((prev) => ({ ...prev, visible: false }))}
            />
            <View style={styles.modalCard}>
              <View
                style={[
                  styles.modalIconContainer,
                  feedbackModal.type === 'success'
                    ? styles.modalIconSuccess
                    : feedbackModal.type === 'error'
                      ? styles.modalIconError
                      : styles.modalIconInfo,
                ]}
              >
                {feedbackModal.type === 'success' ? (
                  <Check size={26} color="#FFFFFF" strokeWidth={3} />
                ) : feedbackModal.type === 'error' ? (
                  <X size={26} color="#FFFFFF" strokeWidth={3} />
                ) : (
                  <Sparkles size={26} color="#FFFFFF" strokeWidth={2.4} />
                )}
              </View>

              <Text style={styles.modalTitleText}>
                {feedbackModal.title}
              </Text>

              <Text style={styles.modalMessageText}>
                {feedbackModal.message}
              </Text>

              <View style={styles.modalActionsRow}>
                {feedbackModal.actionLabel && feedbackModal.onAction ? (
                  <PressableScale
                    scaleTo={0.96}
                    onPress={() => {
                      feedbackModal.onAction?.();
                      setFeedbackModal((prev) => ({ ...prev, visible: false }));
                    }}
                    style={styles.modalPrimaryBtn}
                  >
                    <Text style={styles.modalPrimaryBtnText}>
                      {feedbackModal.actionLabel}
                    </Text>
                  </PressableScale>
                ) : null}

                <PressableScale
                  scaleTo={0.96}
                  onPress={() => setFeedbackModal((prev) => ({ ...prev, visible: false }))}
                  style={[
                    styles.modalPrimaryBtn,
                    feedbackModal.actionLabel ? styles.modalSecondaryBtn : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.modalPrimaryBtnText,
                      feedbackModal.actionLabel ? styles.modalSecondaryBtnText : null,
                    ]}
                  >
                    {t('common.ok', 'ঠিক আছে')}
                  </Text>
                </PressableScale>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create((theme) => ({
  /* --- Modal Header --- */
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextGroup: {
    flex: 1,
    gap: 2,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text,
  },
  closeButton: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: theme.colors.primaryMuted,
  },

  /* --- Scroll Container --- */
  scrollArea: {
    maxHeight: 460,
  },
  scrollContent: {
    paddingBottom: 16,
    paddingHorizontal: 2,
  },

  /* --- THE PHOTO CARD --- */
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cardHeaderBanner: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 16,
  },
  cardTopBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  appBrandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  appBrandText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  datePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  datePillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  cardProjectTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },

  /* --- Financial Metrics Bar --- */
  cardMetricsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },

  /* --- Card Sections --- */
  cardSection: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  cardSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 10,
  },
  cardSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },

  /* --- Settlement Section --- */
  settledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#DCFCE7',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  settledBannerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#15803D',
    flex: 1,
  },
  settlementList: {
    gap: 8,
  },
  settlementItemBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    gap: 5,
  },
  settlementMembersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  memberBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    maxWidth: 90,
  },
  memberBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5B21B6',
  },
  transferArrowBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 4,
  },
  paysText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  amountPill: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
  },
  amountPillText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065F46',
  },
  settlementSentence: {
    fontSize: 11.5,
    color: '#475569',
    fontWeight: '500',
  },

  /* --- Balance Section --- */
  balanceList: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  balanceMemberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  balanceMemberAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceMemberInitial: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  balanceMemberName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  balanceStatusValue: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#64748B',
  },
  balancePositive: {
    color: '#16A34A',
  },
  balanceNegative: {
    color: '#DC2626',
  },

  /* --- Card Footer --- */
  cardFooter: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
  },
  footerDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginBottom: 8,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  watermarkText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  footerSubText: {
    fontSize: 10.5,
    color: '#94A3B8',
    fontWeight: '500',
  },

  /* --- Modal Bottom Action Buttons Bar --- */
  actionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
  },
  downloadBtn: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.border,
  },
  copyBtn: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.border,
  },
  shareBtn: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text,
  },
  copiedText: {
    color: '#16A34A',
  },
  shareBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.onPrimary,
  },

  /* --- Feedback Modal --- */
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.70)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    zIndex: 999,
  },
  modalDismissArea: {
    ...StyleSheet.absoluteFillObject,
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
  modalIconSuccess: {
    backgroundColor: '#16A34A',
  },
  modalIconError: {
    backgroundColor: '#DC2626',
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
    gap: 10,
    width: '100%',
  },
  modalPrimaryBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.onPrimary,
  },
  modalSecondaryBtn: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalSecondaryBtnText: {
    color: theme.colors.text,
  },
}));
