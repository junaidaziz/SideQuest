import { router } from 'expo-router';
import { useCallback } from 'react';
import ProgressOverviewScreen from '../../src/screens/ProgressOverviewScreen';

/** Progress tab — gamification hub. Drill-downs are stack routes outside the group. */
export default function ProgressTab() {
  const handleOpenLevelDetail = useCallback(() => {
    router.push('/progress/level');
  }, []);

  const handleOpenXpDetail = useCallback(() => {
    router.push('/progress/xp');
  }, []);

  const handleOpenStreakDetail = useCallback(() => {
    router.push('/progress/streak');
  }, []);

  const handleOpenAchievements = useCallback(() => {
    router.push('/achievements');
  }, []);

  const handleOpenAchievement = useCallback((achievementId: string) => {
    router.push({ pathname: '/achievements/[id]', params: { id: achievementId } });
  }, []);

  const handleOpenStatistics = useCallback(() => {
    router.push('/statistics');
  }, []);

  const handleOpenNotifications = useCallback(() => {
    router.push('/notifications');
  }, []);

  return (
    <ProgressOverviewScreen
      onOpenLevelDetail={handleOpenLevelDetail}
      onOpenXpDetail={handleOpenXpDetail}
      onOpenStreakDetail={handleOpenStreakDetail}
      onOpenAchievements={handleOpenAchievements}
      onOpenAchievement={handleOpenAchievement}
      onOpenStatistics={handleOpenStatistics}
      onOpenNotifications={handleOpenNotifications}
    />
  );
}
