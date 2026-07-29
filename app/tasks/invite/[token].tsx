import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import InviteLandingScreen from '../../../src/screens/InviteLandingScreen';
import { useAuthStore } from '../../../src/store/authStore';
import { usePendingInviteStore } from '../../../src/store/pendingInviteStore';

/**
 * Challenge-invite landing route — the live target of a
 * `sidequest://tasks/invite/<token>` deep link (expo-router maps the URL path
 * `/tasks/invite/<token>` here; the Android intent filter in app.json registers
 * the custom scheme). A link with no token has nothing to accept, so it falls
 * back to the Challenges feed.
 */
export default function InviteRoute() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const isGuest = useAuthStore((s) => s.user?.isGuest ?? true);
  const setPendingInvite = usePendingInviteStore((s) => s.setToken);

  const handleAccepted = useCallback((taskId: string) => {
    // The caller is now a bound participant, so the detail screen (GET /tasks/:id)
    // will authorize. replace — the invite landing isn't a place to return to.
    router.replace({ pathname: '/challenges/[id]', params: { id: taskId } });
  }, []);

  const handleDeclined = useCallback(() => {
    router.replace('/challenges');
  }, []);

  const handleSignInFirst = useCallback(() => {
    // Stash the token so the root layout re-opens this invite once auth resolves
    // to a real (non-guest) account, then send the user to sign in.
    if (token) setPendingInvite(token);
    router.push('/login');
  }, [token, setPendingInvite]);

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  if (!token) {
    return <Redirect href="/challenges" />;
  }

  return (
    <InviteLandingScreen
      token={token}
      isGuest={isGuest}
      onAccepted={handleAccepted}
      onDeclined={handleDeclined}
      onSignInFirst={handleSignInFirst}
      onBack={handleBack}
    />
  );
}
