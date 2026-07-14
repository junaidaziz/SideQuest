import { router } from 'expo-router';
import { useCallback } from 'react';
import LevelDetailScreen from '../../src/screens/LevelDetailScreen';

export default function LevelDetailRoute() {
  const handleBack = useCallback(() => {
    router.back();
  }, []);

  return <LevelDetailScreen onBack={handleBack} />;
}
