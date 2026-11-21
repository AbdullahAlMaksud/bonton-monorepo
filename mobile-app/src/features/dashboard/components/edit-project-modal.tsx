import { Settings2, UserPlus, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Keyboard, Pressable, ScrollView, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useTranslation } from 'react-i18next';

import { haptics } from '@/shared/lib/haptics';
import { useBontonStore } from '@/shared/store/bonton-store';
import type { Group, SplitType } from '@/shared/types/bonton';
import {
  BottomSheetModal,
  Button,
  IconButton,
  SegmentedControl,
  type SegmentOption,
  Text,
  TextField,
} from '@/shared/ui';

export interface EditProjectModalProps {
  visible: boolean;
  onClose: () => void;
  group: Group;
}

export function EditProjectModal({ visible, onClose, group }: EditProjectModalProps) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();

  const currentUserName = useBontonStore((s) => s.userName);
  const setGlobalUserName = useBontonStore((s) => s.setUserName);
  const updateGroup = useBontonStore((s) => s.updateGroup);
  const updateMemberName = useBontonStore((s) => s.updateMemberName);
  const addMember = useBontonStore((s) => s.addMember);

  const [projectName, setProjectName] = useState(group.name);
  const [userName, setUserName] = useState(currentUserName);
  const [description, setDescription] = useState(group.description ?? '');
  const [splitType, setSplitType] = useState<SplitType>(group.defaultSplitType ?? 'equal');
  const [participantNames, setParticipantNames] = useState<Record<string, string>>({});
  const [newMemberDraft, setNewMemberDraft] = useState('');
  const [memberError, setMemberError] = useState<string | null>(null);

  // Re-sync local state whenever the modal opens or the active group changes
  useEffect(() => {
    if (visible) {
      setProjectName(group.name);
      setUserName(currentUserName);
      setDescription(group.description ?? '');
      setSplitType(group.defaultSplitType ?? 'equal');
      const map: Record<string, string> = {};
      group.members.forEach((m) => {
        if (!m.isMe) {
          map[m.id] = m.name;
        }
      });
      setParticipantNames(map);
      setNewMemberDraft('');
      setMemberError(null);
    }
  }, [visible, group, currentUserName]);

  const splitOptions: ReadonlyArray<SegmentOption<SplitType>> = [
    { value: 'equal', label: t('expense.splitEqual', 'সমান ভাগ') },
    { value: 'percentage', label: t('expense.splitPercentage', 'শতাংশ') },
    { value: 'custom', label: t('expense.splitCustom', 'নির্দিষ্ট') },
  ];

  const handleAddMember = () => {
    const cleaned = newMemberDraft.trim();
    if (!cleaned) return;
    const res = addMember(group.id, cleaned);
    if (!res.ok) {
      haptics.warning();
      if (res.reason === 'duplicate') {
        setMemberError(t('groupNew.errors.duplicateMember', 'এই নামের সদস্য ইতিমধ্যে আছেন'));
      }
      return;
    }
    haptics.select();
    setNewMemberDraft('');
    setMemberError(null);
  };

  const handleSave = () => {
    Keyboard.dismiss();
    const trimmedProjectName = projectName.trim();
    if (!trimmedProjectName) {
      haptics.error();
      return;
    }

    haptics.success();

    // 1. Update Project / Group details
    updateGroup(group.id, {
      name: trimmedProjectName,
      description: description.trim(),
      defaultSplitType: splitType,
    });

    // 2. Update User Name if changed
    const trimmedUserName = userName.trim();
    if (trimmedUserName && trimmedUserName !== currentUserName) {
      setGlobalUserName(trimmedUserName);
      const myMember = group.members.find((m) => m.isMe);
      if (myMember) {
        updateMemberName(group.id, myMember.id, trimmedUserName);
      }
    }

    // 3. Update Other Participant Names if changed
    Object.entries(participantNames).forEach(([memberId, newName]) => {
      const orig = group.members.find((m) => m.id === memberId);
      const cleaned = newName.trim();
      if (orig && cleaned && cleaned !== orig.name) {
        updateMemberName(group.id, memberId, cleaned);
      }
    });

    // 4. Add pending new member draft if entered
    const pending = newMemberDraft.trim();
    if (pending) {
      addMember(group.id, pending);
    }

    onClose();
  };

  const otherMembers = group.members.filter((m) => !m.isMe);

  return (
    <BottomSheetModal visible={visible} onClose={onClose}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconContainer}>
            <Settings2 size={22} color={theme.colors.primary} />
          </View>
          <View style={styles.headerTextGroup}>
            <Text variant="heading" style={styles.headerTitle}>
              {t('home.editProject', 'গ্রুপ সম্পাদনা')}
            </Text>
            <Text variant="caption" tone="secondary">
              {t('home.editProjectSubtitle', 'গ্রুপের তথ্য ও হিসাব নিয়ম পরিবর্তন করুন')}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={onClose}
          hitSlop={10}
          style={({ pressed }) => [styles.closeButton, pressed && styles.buttonPressed]}
          accessibilityLabel={t('common.close', 'বন্ধ করুন')}
        >
          <X size={18} color={theme.colors.textSecondary} />
        </Pressable>
      </View>

      {/* Form Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        bounces={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.form}>
          {/* 1. Project / Group Name */}
          <TextField
            label={t('home.projectNamePrompt', 'গ্রুপের নাম')}
            value={projectName}
            onChangeText={setProjectName}
            placeholder={t('home.projectNamePlaceholder', 'যেমন: সাজেক ট্যুর')}
            maxLength={50}
          />

          {/* 2. User's Name */}
          <TextField
            label={t('home.userNamePrompt', 'আপনার নাম')}
            value={userName}
            onChangeText={setUserName}
            placeholder={t('home.userNamePlaceholder', 'যেমন: মাকসুদ')}
            maxLength={40}
          />

          {/* 3. Other Participants' Names */}
          {otherMembers.length > 0 && (
            <View style={styles.membersSection}>
              <Text variant="label" tone="secondary" style={styles.fieldLabel}>
                {t('home.participantsLabel', 'পার্টিসিপেন্ট / সদস্যদের নাম')}
              </Text>
              <View style={styles.membersList}>
                {otherMembers.map((member, idx) => (
                  <TextField
                    key={member.id}
                    label={t('home.participantNumber', { number: idx + 1 })}
                    value={participantNames[member.id] ?? member.name}
                    onChangeText={(text) =>
                      setParticipantNames((prev) => ({ ...prev, [member.id]: text }))
                    }
                    placeholder={t('home.participantPlaceholder', 'সদস্যের নাম')}
                    maxLength={40}
                  />
                ))}
              </View>
            </View>
          )}

          {/* 4. Add new participant */}
          <View style={styles.addMemberSection}>
            <View style={styles.addMemberInputRow}>
              <TextField
                containerStyle={styles.addMemberField}
                label={t('home.addNewMember', 'নতুন সদস্য যোগ করুন')}
                value={newMemberDraft}
                onChangeText={(text) => {
                  setNewMemberDraft(text);
                  if (memberError) setMemberError(null);
                }}
                placeholder={t('groupNew.memberPlaceholder', 'যেমন: তানভীর')}
                maxLength={30}
                error={memberError}
              />
              <IconButton
                icon={UserPlus}
                tone="primary"
                label={t('common.add', 'যোগ করুন')}
                onPress={handleAddMember}
                style={styles.addMemberButton}
              />
            </View>
          </View>

          {/* 5. Project Description (Suggested Date format) */}
          <TextField
            label={t('home.projectDescPrompt', 'গ্রুপের বিবরণ')}
            value={description}
            onChangeText={setDescription}
            placeholder={t('home.projectDescPlaceholder', 'যেমন: ২৭ নভেম্বর — ১ ডিসেম্বর ২০২৬')}
            maxLength={120}
          />

          {/* 6. Splitting Method */}
          <View style={styles.splitSection}>
            <Text variant="label" tone="secondary" style={styles.fieldLabel}>
              {t('home.splitMethodPrompt', 'গ্রুপের হিসাব পদ্ধতি')}
            </Text>
            <SegmentedControl
              options={splitOptions}
              value={splitType}
              onChange={setSplitType}
            />
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Button
            label={t('common.save', 'সংরক্ষণ করুন')}
            kind="primary"
            fullWidth
            onPress={handleSave}
          />
        </View>
      </ScrollView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create((theme) => ({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginBottom: theme.spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
  },
  headerIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: theme.colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextGroup: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.isDark ? theme.colors.card : '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  form: {
    gap: theme.spacing.md,
  },
  membersSection: {
    gap: 8,
  },
  membersList: {
    gap: 10,
  },
  addMemberSection: {
    gap: 4,
  },
  addMemberInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  addMemberField: {
    flex: 1,
  },
  addMemberButton: {
    marginBottom: 4,
  },
  splitSection: {
    gap: theme.spacing.xs,
  },
  fieldLabel: {
    marginBottom: 4,
  },
  footer: {
    marginTop: theme.spacing.xl,
  },
}));
