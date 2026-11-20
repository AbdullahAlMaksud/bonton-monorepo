import { useEffect, useState, type ComponentProps } from 'react';
import { BlurView } from 'expo-blur';
import { FolderKanban, House, Plus, User } from 'lucide-react-native';
import { Platform, StyleSheet as RNStyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Redirect, Tabs, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SystemBars } from 'react-native-edge-to-edge';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native-unistyles';

import { haptics } from '@/shared/lib/haptics';
import { useBontonStore } from '@/shared/store/bonton-store';
import { withTheme, type WithTheme } from '@/shared/theme/with-theme';
import { PressableScale, Text } from '@/shared/ui';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

export default function TabsLayout() {
  const hasCompletedOnboarding = useBontonStore((s) => s.hasCompletedOnboarding);

  if (!hasCompletedOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  const { t } = useTranslation();

  return (
    <Tabs
      tabBar={(props) => <CustomBottomBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: styles.scene,
      }}
    >
      {/* 1. Home Tab */}
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home', 'Home'),
        }}
      />

      {/* 2. Projects Tab */}
      <Tabs.Screen
        name="projects"
        options={{
          title: t('tabs.projects', 'Projects'),
        }}
      />

      {/* 3. Profile Tab */}
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile', 'Profile'),
        }}
      />
    </Tabs>
  );
}

type CustomBottomBarProps = WithTheme<TabBarProps>;

function CustomBottomBarComponent({
  state,
  descriptors,
  emitter,
  navigateToTab,
  theme,
}: CustomBottomBarProps) {
  const { t } = useTranslation();

  const [capsuleWidth, setCapsuleWidth] = useState(0);
  const offset = useSharedValue(0);

  const padding = theme.spacing.xs;
  const numTabs = state.routes.length;
  const tabWidth = capsuleWidth > 0 ? (capsuleWidth - padding * 2) / numTabs : 0;

  const handleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && capsuleWidth === 0) {
      const tw = (w - padding * 2) / numTabs;
      offset.value = state.index * tw;
      setCapsuleWidth(w);
    } else if (w > 0 && w !== capsuleWidth) {
      setCapsuleWidth(w);
    }
  };

  useEffect(() => {
    if (tabWidth > 0) {
      offset.value = withSpring(state.index * tabWidth, {
        damping: 18,
        stiffness: 220,
        mass: 0.6,
      });
    }
  }, [state.index, tabWidth, offset]);

  const indicatorStyle = useAnimatedStyle(() => ({
    width: tabWidth,
    transform: [{ translateX: offset.value }],
  }));

  const isHome = state.index === 0;
  // Reverse status bar style on Home screen only (light icons on dark header in light mode).
  // All other screens follow the active theme (dark icons in light mode, light icons in dark mode).
  const statusBarStyle = isHome ? 'light' : (theme.isDark ? 'light' : 'dark');

  return (
    <>
      <StatusBar style={statusBarStyle} />
      <SystemBars style={{ statusBar: statusBarStyle, navigationBar: theme.isDark ? 'light' : 'dark' }} />
      <View style={styles.barContainer} pointerEvents="box-none">
      {/* 1. Pill Capsule with Home, Projects & Profile tabs */}
      <View style={styles.capsule} onLayout={handleLayout}>
        <BlurView
          intensity={Platform.OS === 'ios' ? 80 : 40}
          tint={theme.isDark ? 'dark' : 'light'}
          style={RNStyleSheet.absoluteFill}
        />
        <View style={styles.glassOverlay} />

        {/* Sliding active pill indicator */}
        {tabWidth > 0 && (
          <Animated.View style={[styles.slidingIndicator, indicatorStyle]} />
        )}

        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const { options } = descriptors[route.key];
          const label =
            options.title !== undefined
              ? options.title
              : route.name === 'index'
                ? t('tabs.home', 'Home')
                : route.name === 'projects'
                  ? t('tabs.projects', 'Projects')
                  : t('tabs.profile', 'Profile');

          const onPress = () => {
            haptics.select();
            const event = emitter.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigateToTab(route.key);
            }
          };

          return (
            <PressableScale
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={label}
              scaleTo={0.94}
              onPress={onPress}
              style={styles.tabButton}
            >
              <View
                style={[
                  styles.tabDotIcon,
                  {
                    backgroundColor: isFocused
                      ? theme.colors.primary
                      : theme.colors.secondaryMuted,
                  },
                ]}
              >
                {route.name === 'index' ? (
                  <House
                    size={12}
                    color={isFocused ? theme.colors.onPrimary : theme.colors.textSecondary}
                    strokeWidth={2.5}
                  />
                ) : route.name === 'projects' ? (
                  <FolderKanban
                    size={12}
                    color={isFocused ? theme.colors.onPrimary : theme.colors.textSecondary}
                    strokeWidth={2.5}
                  />
                ) : (
                  <User
                    size={12}
                    color={isFocused ? theme.colors.onPrimary : theme.colors.textSecondary}
                    strokeWidth={2.5}
                  />
                )}
              </View>
              <Text
                variant="caption"
                style={[
                  styles.tabLabel,
                  {
                    color: isFocused
                      ? theme.colors.text
                      : theme.colors.textSecondary,
                    fontWeight: isFocused
                      ? theme.typography.weight.bold
                      : theme.typography.weight.medium,
                  },
                ]}
              >
                {label}
              </Text>
            </PressableScale>
          );
        })}
      </View>

      {/* 2. Circular Action Button (+) navigating directly to add expense */}
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={t('group.addExpense', 'Add Expense')}
        scaleTo={0.92}
        onPress={() => {
          haptics.tap();
          const groups = useBontonStore.getState().groups;
          const activeGroupId = useBontonStore.getState().activeGroupId;
          const activeGroup = groups.find((g) => g.id === activeGroupId) ?? groups[0];
          if (activeGroup) {
            router.push({
              pathname: '/expense/add',
              params: { groupId: activeGroup.id },
            });
          } else {
            router.push('/groups/new');
          }
        }}
        style={styles.fabButton}
      >
        <Plus
          size={28}
          color={theme.colors.onPrimary}
          strokeWidth={2.8}
        />
      </PressableScale>
    </View>
    </>
  );
}

const CustomBottomBar = withTheme(CustomBottomBarComponent);

const styles = StyleSheet.create((theme, rt) => ({
  scene: {
    backgroundColor: theme.colors.background,
  },
  barContainer: {
    position: 'absolute',
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    bottom: Math.max(rt.insets.bottom, theme.spacing.xs) + theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  capsule: {
    flex: 1,
    height: 64,
    borderRadius: theme.radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor:
      Platform.OS === 'ios'
        ? 'transparent'
        : theme.colors.card,
    ...theme.shadows.md,
    overflow: 'hidden',
  },
  glassOverlay: {
    ...RNStyleSheet.absoluteFill,
    backgroundColor: theme.isDark
      ? 'rgba(24, 24, 27, 0.70)'
      : theme.colors.card,
    opacity: 0.85,
  },
  slidingIndicator: {
    position: 'absolute',
    top: theme.spacing.xs,
    bottom: theme.spacing.xs,
    left: theme.spacing.xs,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.primaryMuted,
  },
  tabButton: {
    flex: 1,
    height: '100%',
    flexDirection: 'row',
    gap: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.pill,
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  tabDotIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: theme.typography.size.sm,
    marginTop: 1,
  },
  fabButton: {
    width: 64,
    height: 64,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.md,
  },
}));
