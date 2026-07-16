import { router } from 'expo-router';
import { useCallback } from 'react';
import NotificationsScreen from '../src/screens/NotificationsScreen';

/**
 * The notification inbox, reached from the bell icon on Today and Progress.
 * Deep-linking into a specific notification's target (task detail, etc.) is
 * not wired yet — opening a row currently only marks it read; the backend's
 * `data` payload shape is documented but no per-type routing table exists in
 * this migration.
 */
export default function NotificationsRoute() {
  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleExplore = useCallback(() => {
    router.push('/explore');
  }, []);

  return <NotificationsScreen onBack={handleBack} onExplore={handleExplore} />;
}
