import { router } from 'expo-router';
import { useCallback } from 'react';
import ChallengeFeedScreen from '../../src/screens/ChallengeFeedScreen';

/**
 * Challenge feed. Reachable by deep link today — no current Compass screen
 * exposes a callback into the challenges island; the internal navigation
 * (create, open detail) is fully wired here for when a top-level entry lands.
 */
export default function ChallengeFeedRoute() {
  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleCreateChallenge = useCallback(() => {
    router.push('/challenges/create');
  }, []);

  const handleOpenChallenge = useCallback((taskId: string) => {
    router.push({ pathname: '/challenges/[id]', params: { id: taskId } });
  }, []);

  return (
    <ChallengeFeedScreen
      onBack={handleBack}
      onCreateChallenge={handleCreateChallenge}
      onOpenChallenge={handleOpenChallenge}
    />
  );
}
