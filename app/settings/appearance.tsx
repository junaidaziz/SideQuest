import { router } from 'expo-router';
import { useCallback } from 'react';
import AppearanceAccessibilityScreen from '../../src/screens/AppearanceAccessibilityScreen';

export default function AppearanceRoute() {
  const handleBack = useCallback(() => {
    router.back();
  }, []);

  return (
    <AppearanceAccessibilityScreen
      onBack={handleBack}
      // onChange left unwired: the screen owns local state until an app-wide
      // theme controller / persistence layer lands (see the screen's TODO).
      // onOpenTextSettings left unwired: no OS deep-link is defined here.
    />
  );
}
