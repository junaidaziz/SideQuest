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
  const avatarUrl = useAuthStore((s) => s.user?.avatarUrl ?? null);
  const avatarVariants = useAuthStore((s) => s.user?.avatarVariants ?? null);

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

  const handleOpenNotifications = useCallback(() => {
    router.push('/notifications');
  }, []);

  return (
    <TodayScreen
      displayName={displayName}
      avatarUrl={avatarUrl}
      avatarVariants={avatarVariants}
      onGetInspired={handleGetInspired}
      onOpenExplore={handleOpenExplore}
      onOpenProfile={handleOpenProfile}
      onOpenPendingProof={handleOpenPendingProof}
      onOpenNotifications={handleOpenNotifications}
    />
  );
}
