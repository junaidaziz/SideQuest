import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo } from 'react';
import QuestDetailScreen from '../../src/screens/QuestDetailScreen';
import type { Mission } from '../../src/types/api';

/**
 * Quest detail. Callers that hold the Mission object (QuestResultsScreen) pass
 * it serialized; callers that only have an id (Explore/Community placeholder
 * cards) pass nothing but the id, and QuestDetailScreen renders its
 * "unavailable" state — there is no single-mission GET endpoint to resolve it.
 */
export default function QuestDetailRoute() {
  const { mission: missionParam } = useLocalSearchParams<{ mission: string }>();
  const mission = useMemo<Mission | undefined>(() => {
    if (!missionParam) return undefined;
    try {
      return JSON.parse(missionParam) as Mission;
    } catch {
      return undefined;
    }
  }, [missionParam]);

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleAccept = useCallback((accepted: Mission) => {
    router.push({
      pathname: '/quest/active/[id]',
      params: { id: accepted.id, mission: JSON.stringify(accepted) },
    });
  }, []);

  const handleRetry = useCallback(() => {
    router.back();
  }, []);

  return (
    <QuestDetailScreen
      mission={mission}
      onBack={handleBack}
      onAccept={handleAccept}
      onRetry={handleRetry}
      // onShare intentionally left unwired: no share surface is defined for a
      // not-yet-accepted quest. Documented no-op.
    />
  );
}
