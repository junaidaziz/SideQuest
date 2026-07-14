import { router } from 'expo-router';
import { useCallback } from 'react';
import StreakDetailScreen from '../../src/screens/StreakDetailScreen';

export default function StreakDetailRoute() {
  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleFindQuest = useCallback(() => {
    router.push('/explore');
  }, []);

  return <StreakDetailScreen onBack={handleBack} onFindQuest={handleFindQuest} />;
}
