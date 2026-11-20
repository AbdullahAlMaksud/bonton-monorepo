import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';
import { SystemBars } from 'react-native-edge-to-edge';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { UnistylesRuntime, useUnistyles } from 'react-native-unistyles';

import i18n from '@/shared/i18n';
import { useBontonStore } from '@/shared/store/bonton-store';
import { useStoreHydrated } from '@/shared/store/selectors';
import { customFontMap } from '@/shared/theme/fonts';
import { themes } from '@/shared/theme/themes';
import { AppErrorBoundary } from '@/shared/ui';

// Expo Router renders this when a route throws while rendering.
export { RouteErrorBoundary as ErrorBoundary } from '@/shared/ui/error-boundary';

void SplashScreen.preventAutoHideAsync();

/** If AsyncStorage never answers, start with defaults instead of hanging on the splash screen. */
const HYDRATION_TIMEOUT_MS = 4000;

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppErrorBoundary>
        <AppBootstrap>
          <ThemedStack />
        </AppBootstrap>
      </AppErrorBoundary>
    </SafeAreaProvider>
  );
}

/**
 * Holds the splash screen until persisted state is loaded, then applies the saved theme
 * and language BEFORE the first real frame, and keeps them in sync with the store after.
 */
function AppBootstrap({ children }: { children: ReactNode }) {
  const [fontsLoaded, fontError] = useFonts(customFontMap);
  const hydrated = useStoreHydrated();
  const theme = useBontonStore((s) => s.theme);
  const language = useBontonStore((s) => s.language);
  const [timedOut, setTimedOut] = useState(false);
  const [applied, setApplied] = useState(false);
  const ready = ((fontsLoaded || fontError) && hydrated) || timedOut;

  useEffect(() => {
    const id = setTimeout(() => setTimedOut(true), HYDRATION_TIMEOUT_MS);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!ready) return;
    UnistylesRuntime.setTheme(theme);
    UnistylesRuntime.setRootViewBackgroundColor(themes[theme].colors.background);
    void i18n.changeLanguage(language).then(() => setApplied(true));
  }, [ready, theme, language]);

  useEffect(() => {
    if (applied) void SplashScreen.hideAsync();
  }, [applied]);

  if (!applied) {
    const activeTheme = themes[theme] || themes.light;
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: activeTheme.colors.background,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color={activeTheme.colors.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

function ThemedStack() {
  const { theme } = useUnistyles();
  const { t } = useTranslation();

  return (
    <>
      {/* Edge-to-edge system bars; icon color follows the active theme. */}
      <SystemBars style={theme.isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.text,
          headerTitleStyle: { fontWeight: theme.typography.weight.semibold },
          headerShadowVisible: false,
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="groups/new" options={{ presentation: 'modal', title: t('groupNew.title') }} />
        <Stack.Screen name="groups/[id]" options={{ title: '' }} />
        <Stack.Screen name="expense/add" options={{ presentation: 'modal', title: t('expense.addTitle') }} />
      </Stack>
    </>
  );
}
