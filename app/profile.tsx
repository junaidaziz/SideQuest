import { router } from 'expo-router';
import { useCallback } from 'react';
import ProfileScreen from '../src/screens/ProfileScreen';

export default function ProfileRoute() {
  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleCreateAccount = useCallback(() => {
    router.push('/signup-prompt');
  }, []);

  const handleLoginExisting = useCallback(() => {
    router.push('/login');
  }, []);

  const handleLoggedOut = useCallback(() => {
    // logout() already re-bootstraps a fresh guest session before this
    // fires (see authStore.ts), so the store is 'ready' by the time we
    // navigate — replace, not push, so Profile isn't reachable via back
    // from the fresh session.
    router.replace('/home');
  }, []);

  return (
    <ProfileScreen
      onBack={handleBack}
      onCreateAccount={handleCreateAccount}
      onLoginExisting={handleLoginExisting}
      onLoggedOut={handleLoggedOut}
    />
  );
}
