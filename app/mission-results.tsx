import { Redirect, useLocalSearchParams } from 'expo-router';

/**
 * Retired route — superseded by /quest-results (QuestResultsScreen) in the
 * Compass redesign. Kept as a forwarding redirect (not deleted) so any
 * external/deep link still pointing at /mission-results?filters=… preserves
 * its filters into the new screen. The old MissionResultsScreen source has
 * since been removed as dead code.
 */
export default function MissionResultsRoute() {
  const { filters } = useLocalSearchParams<{ filters: string }>();

  if (filters) {
    return <Redirect href={{ pathname: '/quest-results', params: { filters } }} />;
  }
  return <Redirect href="/explore" />;
}
