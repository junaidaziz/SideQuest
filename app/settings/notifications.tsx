import { router } from 'expo-router';
import { useCallback } from 'react';
import NotificationPreferencesScreen from '../../src/screens/NotificationPreferencesScreen';

export default function NotificationPreferencesRoute() {
  const handleBack = useCallback(() => {
    router.back();
  }, []);

  return (
    <NotificationPreferencesScreen
      onBack={handleBack}
      // onChange left unwired: the screen owns local state until the
      // PATCH /notifications/preferences endpoint lands (see the screen's TODO).
    />
  );
}
