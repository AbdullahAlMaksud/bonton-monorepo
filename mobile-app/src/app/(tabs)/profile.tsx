import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { DotBackground } from '@/features/dashboard/components';
import {
  CurrencyModal,
  EditProfileModal,
  FontModal,
  ProfileAboutCard,
  ProfileHeaderCard,
  ProfileLanguageCard,
  ProfilePreferencesCard,
  ProfileThemeFontCard,
  ThemeModal,
} from '@/features/profile/components';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useUnistyles();

  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [fontModalVisible, setFontModalVisible] = useState(false);
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);

  return (
    <View style={styles.root}>
      {/* Subtle Dot Matrix Background */}
      <DotBackground size={24} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + theme.spacing.md,
            paddingBottom: insets.bottom + 110,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Header with Avatar, Pencil Edit, Camera badge, Name & Subtitle */}
        <ProfileHeaderCard onEditPress={() => setEditModalVisible(true)} />

        {/* 2. Language Selection Card */}
        <ProfileLanguageCard />

        {/* 3. Preferences Card (with Currency selection) */}
        <ProfilePreferencesCard
          onOpenCurrencyModal={() => setCurrencyModalVisible(true)}
        />

        {/* 4. Theme and Font Settings Card */}
        <ProfileThemeFontCard
          onOpenThemeModal={() => setThemeModalVisible(true)}
          onOpenFontModal={() => setFontModalVisible(true)}
        />

        {/* 5. About App Card */}
        <ProfileAboutCard />
      </ScrollView>

      {/* Theme Selection Modal */}
      <ThemeModal
        visible={themeModalVisible}
        onClose={() => setThemeModalVisible(false)}
      />

      {/* Font Selection Modal */}
      <FontModal
        visible={fontModalVisible}
        onClose={() => setFontModalVisible(false)}
      />

      {/* Currency Selection Modal */}
      <CurrencyModal
        visible={currencyModalVisible}
        onClose={() => setCurrencyModalVisible(false)}
      />

      {/* Profile Edit Modal */}
      <EditProfileModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
}));
