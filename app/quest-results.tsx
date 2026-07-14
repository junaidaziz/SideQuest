import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo } from 'react';
import QuestResultsScreen from '../src/screens/QuestResultsScreen';
import type { GenerateMissionsRequest, Mission } from '../src/types/api';

/**
 * Quest results (the Compass replacement for the old MissionResultsScreen).
 * Pushed from the Explore tab with a serialized filter set. A cold-start deep
 * link with no/invalid filters falls back to Explore, where the user can
 * regenerate — there's no prior context to resume.
 */
export default function QuestResultsRoute() {
  const { filters: filtersParam } = useLocalSearchParams<{ filters: string }>();
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

  const handleViewDetails = useCallback((mission: Mission) => {
    // No single-mission GET endpoint exists, so the full Mission object is
    // handed to the detail route as a serialized param (same pattern the old
    // mission-results route used for filters).
    router.push({
      pathname: '/quest/[id]',
      params: { id: mission.id, mission: JSON.stringify(mission) },
    });
  }, []);

  if (!filters) {
    return <Redirect href="/explore" />;
  }

  return (
    <QuestResultsScreen
      filters={filters}
      onBack={handleBack}
      onViewDetails={handleViewDetails}
      // onEditContext intentionally left unwired: no context-editor screen
      // exists in this migration. Documented no-op.
    />
  );
}
