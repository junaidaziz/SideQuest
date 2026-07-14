import { router } from 'expo-router';
import { useCallback } from 'react';
import TodayScreen from '../../src/screens/TodayScreen';
import { useAuthStore } from '../../src/store/authStore';

/**
 * Today tab — the post-hydration landing surface (app/index.tsx redirects here).
 * Thin wrapper: binds TodayScreen's callback props to real navigation.
 */
export default function TodayTab() {
  const displayName = useAuthStore((s) => s.user?.displayName ?? null);

  const handleGetInspired = useCallback(() => {
    router.push('/explore');
  }, []);

  const handleOpenExplore = useCallback(() => {
    router.push('/explore');
  }, []);

  const handleOpenProfile = useCallback(() => {
    router.push('/you');
  }, []);

  const handleOpenPendingProof = useCallback(() => {
    // TodayScreen's pending-proof card is placeholder content — there's no
    // backend feed of in-flight verifications yet, so this opens the
    // verification detail with a placeholder id; the screen renders its
    // unavailable/empty state when it can't resolve a real completion.
    router.push('/verification/pending');
  }, []);

  return (
    <TodayScreen
      displayName={displayName}
      onGetInspired={handleGetInspired}
      onOpenExplore={handleOpenExplore}
      onOpenProfile={handleOpenProfile}
      onOpenPendingProof={handleOpenPendingProof}
      // onOpenNotifications intentionally left unwired: there is no
      // notification inbox/feed screen in this migration (only a notification
      // *preferences* screen under Settings, which the bell should not open).
      // Left as a documented no-op, matching the app/home.tsx onOpenPack
      // precedent, rather than routed somewhere unrelated.
    />
  );
}
