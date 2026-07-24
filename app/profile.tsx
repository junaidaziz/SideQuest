import { Redirect } from 'expo-router';

/**
 * Retired route — superseded by the You tab (app/(tabs)/you.tsx) in the
 * Compass redesign. Kept as a redirect (not deleted) so any external/deep link
 * still pointing at /profile lands somewhere valid instead of 404ing. The old
 * ProfileScreen source has since been removed as dead code.
 */
export default function ProfileRoute() {
  return <Redirect href="/you" />;
}
