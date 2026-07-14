import { router } from 'expo-router';
import { useCallback } from 'react';
import StatisticsScreen from '../src/screens/StatisticsScreen';

export default function StatisticsRoute() {
  const handleBack = useCallback(() => {
    router.back();
  }, []);

  return <StatisticsScreen onBack={handleBack} />;
}
