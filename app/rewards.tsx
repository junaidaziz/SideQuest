import { router } from 'expo-router';
import { useCallback } from 'react';
import { Share } from 'react-native';
import RewardsScreen from '../src/screens/RewardsScreen';

/**
 * Rewards / referrals. Reachable by deep link today — no current Compass
 * screen exposes a callback into it; its top-level entry point is added once a
 * rewards hub lands.
 */
export default function RewardsRoute() {
  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleShareInvite = useCallback((inviteUrl: string) => {
    Share.share({ message: inviteUrl }).catch(() => {});
  }, []);

  return <RewardsScreen onBack={handleBack} onShareInvite={handleShareInvite} />;
}
