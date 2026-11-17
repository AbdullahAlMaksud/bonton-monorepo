import { useEffect, useState, type ComponentProps } from 'react';
import { BlurView } from 'expo-blur';
import { House, Plus, User } from 'lucide-react-native';
import { Platform, StyleSheet as RNStyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Tabs, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native-unistyles';

import { haptics } from '@/shared/lib/haptics';
import { withTheme, type WithTheme } from '@/shared/theme/with-theme';
import { PressableScale, Text } from '@/shared/ui';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

export default function TabsLayout() {
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
          title: t('tabs.home'),
        }}
      />

      {/* 2. Profile Tab */}
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
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

  return (
    <View style={styles.barContainer} pointerEvents="box-none">
      {/* 1. Pill Capsule with Home & Profile tabs */}
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
                ? t('tabs.home')
                : t('tabs.profile');

          const Icon = route.name === 'index' ? House : User;

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
              <Icon
                size={21}
                color={
                  isFocused ? theme.colors.primary : theme.colors.textSecondary
                }
                strokeWidth={isFocused ? 2.5 : 1.9}
              />
              <Text
                variant="caption"
                style={[
                  styles.tabLabel,
                  {
                    color: isFocused
                      ? theme.colors.primary
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

      {/* 2. Circular Action Button (+) matching user wireframe */}
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={t('dashboard.newGroup')}
        scaleTo={0.92}
        onPress={() => {
          haptics.tap();
          router.push('/groups/new');
        }}
        style={styles.fabButton}
      >
        <Plus
          size={26}
          color={theme.colors.onPrimary}
          strokeWidth={2.6}
        />
      </PressableScale>
    </View>
  );
}

const CustomBottomBar = withTheme(CustomBottomBarComponent);

const styles = StyleSheet.create((theme, rt) => ({
  scene: {
    backgroundColor: theme.colors.background,
  },
  barContainer: {
    position: 'absolute',
    left: theme.spacing.xl,
    right: theme.spacing.xl,
    bottom: Math.max(rt.insets.bottom, theme.spacing.md) + theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xxl,
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
    borderWidth: 1.2,
    borderColor: theme.isDark
      ? 'rgba(255, 255, 255, 0.14)'
      : theme.colors.border,
    backgroundColor:
      Platform.OS === 'ios'
        ? 'transparent'
        : theme.isDark
          ? 'rgba(24, 24, 27, 0.90)'
          : 'rgba(255, 255, 255, 0.94)',
    ...theme.shadows.md,
    overflow: 'hidden',
  },
  glassOverlay: {
    ...RNStyleSheet.absoluteFill,
    backgroundColor: theme.isDark
      ? 'rgba(24, 24, 27, 0.70)'
      : 'rgba(255, 255, 255, 0.78)',
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.pill,
    gap: 2,
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  tabLabel: {
    fontSize: 11,
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
