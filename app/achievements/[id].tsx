import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import AchievementDetailScreen from '../../src/screens/AchievementDetailScreen';

export default function AchievementDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  if (!id) {
    return <Redirect href="/achievements" />;
  }

  return (
    <AchievementDetailScreen
      achievementId={id}
      onBack={handleBack}
      // onShare intentionally left unwired: no share-sheet integration is
      // defined for this migration. Documented no-op.
    />
  );
}
