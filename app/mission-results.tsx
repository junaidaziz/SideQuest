import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo } from 'react';
import MissionResultsScreen from '../src/screens/MissionResultsScreen';
import type { GenerateMissionsRequest, Mission } from '../src/types/api';

export default function MissionResultsRoute() {
  const { filters: filtersParam } = useLocalSearchParams<{ filters: string }>();
  // Set by app/onboarding.tsx's router.push, but a cold-start deep link
  // straight into this route (no filters param, or a malformed one) is
  // still reachable in principle — fall back to onboarding rather than
  // crashing on JSON.parse.
  const filters = useMemo<GenerateMissionsRequest | null>(() => {
    if (!filtersParam) return null;
    try {
      return JSON.parse(filtersParam) as GenerateMissionsRequest;
    } catch {
      return null;
    }
  }, [filtersParam]);

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleAccept = useCallback((mission: Mission) => {
    router.push({
      pathname: '/proof-submission/[missionId]',
      params: { missionId: mission.id, proofRequirement: mission.proof },
    });
  }, []);

  if (!filters) {
    return <Redirect href="/onboarding" />;
  }

  return <MissionResultsScreen filters={filters} onBack={handleBack} onAccept={handleAccept} />;
}
