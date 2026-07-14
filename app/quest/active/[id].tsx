import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo } from 'react';
import ActiveQuestScreen from '../../../src/screens/ActiveQuestScreen';
import type { Mission } from '../../../src/types/api';

/**
 * Active quest. Reached from QuestDetailScreen's "accept" with the Mission
 * object serialized. A cold-start deep link with no mission has no quest to
 * run, so it falls back to Explore.
 */
export default function ActiveQuestRoute() {
  const { mission: missionParam } = useLocalSearchParams<{ mission: string }>();
  const mission = useMemo<Mission | null>(() => {
    if (!missionParam) return null;
    try {
      return JSON.parse(missionParam) as Mission;
    } catch {
      return null;
    }
  }, [missionParam]);

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleReadyToFinish = useCallback((finished: Mission) => {
    router.push({
      pathname: '/proof/[missionId]',
      params: {
        missionId: finished.id,
        missionTitle: finished.title,
        proofRequirement: finished.proof,
      },
    });
  }, []);

  const handleRetry = useCallback(() => {
    router.back();
  }, []);

  if (!mission) {
    return <Redirect href="/explore" />;
  }

  return (
    <ActiveQuestScreen
      mission={mission}
      onBack={handleBack}
      onReadyToFinish={handleReadyToFinish}
      onRetry={handleRetry}
      // onOptions intentionally left unwired: no quest-options sheet screen
      // exists in this migration. Documented no-op.
    />
  );
}
