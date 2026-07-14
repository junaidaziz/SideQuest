import { router } from 'expo-router';
import { useCallback } from 'react';
import LeaderboardsScreen from '../src/screens/LeaderboardsScreen';
import { useAuthStore } from '../src/store/authStore';

/**
 * Leaderboards. Reachable by deep link today — no current Compass screen
 * exposes a callback into it; its top-level entry point is added once a social
 * hub lands.
 */
export default function LeaderboardsRoute() {
  const displayName = useAuthStore((s) => s.user?.displayName ?? null);

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  return (
    <LeaderboardsScreen
      displayName={displayName}
      onBack={handleBack}
      // onOpenWeekPicker intentionally left unwired: no week-picker screen
      // exists in this migration. Documented no-op.
    />
  );
}
