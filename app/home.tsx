import { Redirect } from 'expo-router';

/**
 * Retired route — superseded by the Today tab (app/(tabs)/today.tsx) in the
 * Compass redesign. Kept as a redirect (not deleted) so any external/deep link
 * still pointing at /home lands somewhere valid instead of 404ing. The old
 * HomeScreen source was removed as dead code once its last dependency (a
 * `whenPressed` helper cross-imported by PaymentMethodsScreen) was inlined.
 */
export default function HomeRoute() {
  return <Redirect href="/today" />;
}
