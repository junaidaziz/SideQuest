import { router } from 'expo-router';
import { useCallback } from 'react';
import OnboardingScreen, { type OnboardingSelections } from '../src/screens/OnboardingScreen';
import type { Crew, CostBudget, GenerateMissionsRequest, Setting, TimeBudget } from '../src/types/api';

/**
 * Maps the carousel's index-keyed selections to the named request shape the
 * backend expects. Index order is fixed by OnboardingScreen's own STEPS
 * array (0=crew, 1=time, 2=setting, 3=budget) — onComplete only fires once
 * all four steps are answered, so every field is guaranteed present here.
 */
export function toFilters(selections: OnboardingSelections): GenerateMissionsRequest {
  return {
    crew: selections[0] as Crew,
    time: selections[1] as TimeBudget,
    setting: selections[2] as Setting,
    budget: selections[3] as CostBudget,
  };
}

export default function OnboardingRoute() {
  const handleComplete = useCallback((selections: OnboardingSelections) => {
    const filters = toFilters(selections);
    // Compass redesign: the first-launch quest generation now lands on the new
    // QuestResultsScreen (/quest-results), not the retired /mission-results.
    router.push({ pathname: '/quest-results', params: { filters: JSON.stringify(filters) } });
  }, []);

  return <OnboardingScreen onComplete={handleComplete} />;
}
