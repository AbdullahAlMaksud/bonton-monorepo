import { UserPlus } from 'lucide-react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native-unistyles';

import { haptics } from '@/shared/lib/haptics';
import { useBontonStore } from '@/shared/store/bonton-store';
import { useGroup } from '@/shared/store/selectors';
import { GROUP_ICON_NAMES, type GroupIconName } from '@/shared/types/bonton';
import { Button, Chip, GroupIcon, IconButton, PressableScale, Screen, Text, TextField } from '@/shared/ui';

const normalize = (name: string): string => name.replace(/\s+/g, ' ').trim();

/**
 * Create a group (default) or, with `?groupId=`, edit a group's name and icon.
 * Members of an existing group are managed on the group screen, where removal
 * can show the member's balance and rebalance the expenses.
 */
export default function GroupFormScreen() {
  const { t } = useTranslation();
  const { groupId } = useLocalSearchParams<{ groupId?: string }>();
  const existing = useGroup(groupId);
  const isEditing = existing !== undefined;

  const createGroup = useBontonStore((s) => s.createGroup);
  const updateGroup = useBontonStore((s) => s.updateGroup);

  const [name, setName] = useState(existing?.name ?? '');
  const [icon, setIcon] = useState<GroupIconName>(existing?.icon ?? 'wallet');
  const [memberDraft, setMemberDraft] = useState('');
  const [memberNames, setMemberNames] = useState<string[]>([]);
  const [nameError, setNameError] = useState<string | null>(null);
  const [memberError, setMemberError] = useState<string | null>(null);

  const addMember = (): boolean => {
    const cleaned = normalize(memberDraft);
    if (cleaned === '') return false;
    if (memberNames.some((m) => m.toLocaleLowerCase() === cleaned.toLocaleLowerCase())) {
      haptics.warning();
      setMemberError(t('groupNew.errors.duplicateMember'));
      return false;
    }
    haptics.select();
    setMemberNames((prev) => [...prev, cleaned]);
    setMemberDraft('');
    setMemberError(null);
    return true;
  };

  const submit = () => {
    const cleanedName = normalize(name);
    if (cleanedName === '') {
      haptics.error();
      setNameError(t('groupNew.errors.nameRequired'));
      return;
    }

    if (isEditing && existing) {
      updateGroup(existing.id, { name: cleanedName, icon });
      haptics.success();
      router.back();
      return;
    }

    // Include a name that was typed but not yet added with the "+" button.
    const pending = normalize(memberDraft);
    const allMembers =
      pending !== '' && !memberNames.some((m) => m.toLocaleLowerCase() === pending.toLocaleLowerCase())
        ? [...memberNames, pending]
        : memberNames;

    if (allMembers.length === 0) {
      haptics.error();
      setMemberError(t('groupNew.errors.minMembers'));
      return;
    }

    const id = createGroup({ name: cleanedName, icon, memberNames: allMembers });
    haptics.success();
    router.replace({ pathname: '/groups/[id]', params: { id } });
  };

  return (
    <>
      <Stack.Screen options={{ title: isEditing ? t('groupNew.editTitle') : t('groupNew.title') }} />
      <Screen
        footer={
          <Button
            fullWidth
            label={isEditing ? t('groupNew.saveChanges') : t('groupNew.create')}
            onPress={submit}
          />
        }
      >
        <TextField
          label={t('groupNew.nameLabel')}
          placeholder={t('groupNew.namePlaceholder')}
          value={name}
          onChangeText={(text) => {
            setName(text);
            if (nameError) setNameError(null);
          }}
          error={nameError}
          maxLength={40}
          returnKeyType="done"
        />

        <View style={styles.section}>
          <Text variant="label" tone="secondary">
            {t('groupNew.iconLabel')}
          </Text>
          <View style={styles.iconRow} accessibilityRole="radiogroup">
            {GROUP_ICON_NAMES.map((candidate) => (
              <IconChoice
                key={candidate}
                name={candidate}
                label={t(`groupNew.icons.${candidate}`)}
                selected={candidate === icon}
                onPress={() => {
                  haptics.select();
                  setIcon(candidate);
                }}
              />
            ))}
          </View>
        </View>

        {isEditing ? null : (
          <View style={styles.section}>
            <Text variant="label" tone="secondary">
              {t('groupNew.membersLabel')}
            </Text>
            <View style={styles.memberInput}>
              <TextField
                containerStyle={styles.memberField}
                placeholder={t('groupNew.memberPlaceholder')}
                value={memberDraft}
                onChangeText={(text) => {
                  setMemberDraft(text);
                  if (memberError) setMemberError(null);
                }}
                onSubmitEditing={addMember}
                error={memberError}
                maxLength={30}
                returnKeyType="done"
                blurOnSubmit={false}
              />
              <IconButton icon={UserPlus} tone="primary" label={t('common.add')} onPress={addMember} />
            </View>
            <View style={styles.chips}>
              {/* The current user is always a member and cannot be removed. */}
              <Chip label={t('common.you')} selected />
              {memberNames.map((member) => (
                <Chip
                  key={member}
                  label={member}
                  removeLabel={`${t('common.remove')} ${member}`}
                  onRemove={() => setMemberNames((prev) => prev.filter((m) => m !== member))}
                />
              ))}
            </View>
          </View>
        )}
      </Screen>
    </>
  );
}

interface IconChoiceProps {
  name: GroupIconName;
  label: string;
  selected: boolean;
  onPress: () => void;
}

function IconChoice({ name, label, selected, onPress }: IconChoiceProps) {
  styles.useVariants({ selected });
  return (
    <PressableScale
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      scaleTo={0.94}
      onPress={onPress}
      style={styles.choice}
    >
      <GroupIcon name={name} size="lg" selected={selected} />
      <Text variant="caption" tone={selected ? 'primary' : 'secondary'} numberOfLines={1}>
        {label}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create((theme) => ({
  section: {
    gap: theme.spacing.sm,
  },
  iconRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  choice: {
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    minWidth: 68,
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    variants: {
      selected: {
        true: { borderColor: theme.colors.primary },
        false: { borderColor: 'transparent' },
      },
    },
  },
  memberInput: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  memberField: {
    flex: 1,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
}));
