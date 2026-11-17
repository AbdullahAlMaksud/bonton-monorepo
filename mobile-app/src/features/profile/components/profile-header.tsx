import { ShieldCheck, User } from 'lucide-react-native';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { Card, Text } from '@/shared/ui';

export interface ProfileHeaderProps {
  name?: string;
  groupCount: number;
}

export function ProfileHeader({ name, groupCount }: ProfileHeaderProps) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();

  const displayName = name && name.trim().length > 0 ? name : t('common.you');

  return (
    <Animated.View entering={FadeInDown.duration(350).springify()}>
      <Card style={styles.card}>
        {/* Avatar Circle */}
        <View style={styles.avatar}>
          <User size={36} color={theme.colors.onPrimary} strokeWidth={2.2} />
        </View>

        {/* User Info */}
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text variant="title" numberOfLines={1} style={styles.name}>
              {displayName}
            </Text>
            <View style={styles.badge}>
              <Text variant="caption" style={styles.badgeText}>
                {t('profile.userBadge')}
              </Text>
            </View>
          </View>

          {/* Offline Security Pill */}
          <View style={styles.securityRow}>
            <ShieldCheck size={15} color={theme.colors.success} strokeWidth={2.4} />
            <Text variant="caption" tone="secondary">
              {t('profile.offlineStatus')}
            </Text>
          </View>
        </View>
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: theme.colors.border,
  },
  info: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  name: {
    fontWeight: theme.typography.weight.bold,
  },
  badge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.primaryMuted,
  },
  badgeText: {
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.primaryText,
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
}));
