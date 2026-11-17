import { LayoutGrid } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { EmptyState, Screen } from '@/shared/ui';

export default function NotFoundScreen() {
  const { t } = useTranslation();
  return (
    <Screen>
      <EmptyState
        icon={LayoutGrid}
        title={t('errors.notFoundTitle')}
        body=""
        actionLabel={t('errors.goHome')}
        onAction={() => router.replace('/')}
      />
    </Screen>
  );
}
