import { Redirect } from 'expo-router';

/**
 * Retired route — superseded by the Today tab (app/(tabs)/today.tsx) in the
 * Compass redesign. Kept as a redirect (not deleted) so any external/deep link
 * still pointing at /home lands somewhere valid instead of 404ing. The old
 * HomeScreen source is preserved under src/screens/HomeScreen for rollback.
 */
export default function HomeRoute() {
  return <Redirect href="/today" />;
}
