import { router } from 'expo-router';
import { useCallback } from 'react';
import AchievementsScreen from '../../src/screens/AchievementsScreen';

export default function AchievementsRoute() {
  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleOpenAchievement = useCallback((achievementId: string) => {
    router.push({ pathname: '/achievements/[id]', params: { id: achievementId } });
  }, []);

  return <AchievementsScreen onBack={handleBack} onOpenAchievement={handleOpenAchievement} />;
}
