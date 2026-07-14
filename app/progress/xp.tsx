import { router } from 'expo-router';
import { useCallback } from 'react';
import XpDetailScreen from '../../src/screens/XpDetailScreen';

export default function XpDetailRoute() {
  const handleBack = useCallback(() => {
    router.back();
  }, []);

  return <XpDetailScreen onBack={handleBack} />;
}
