import { router } from 'expo-router';
import { useCallback } from 'react';
import CommunityScreen from '../src/screens/CommunityScreen';

/**
 * Community. Reachable by deep link today — no current Compass screen exposes
 * a callback into it (there is no social hub in this migration's screen set),
 * so its top-level entry point is added once such a hub lands.
 */
export default function CommunityRoute() {
  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleOpenQuest = useCallback((questId: string) => {
    router.push({ pathname: '/quest/[id]', params: { id: questId } });
  }, []);

  return (
    <CommunityScreen
      onBack={handleBack}
      onOpenQuest={handleOpenQuest}
      // onOpenGuidelines intentionally left unwired: no guidelines/reporting
      // screen exists in this migration. Documented no-op.
    />
  );
}
