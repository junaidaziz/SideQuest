import { router } from 'expo-router';
import { useCallback } from 'react';
import YouScreen from '../../src/screens/YouScreen';

/**
 * You tab — account surface that supersedes the old ProfileScreen. The
 * signed-in payment-methods entry point is preserved (onPaymentMethods), as is
 * the guest create-account / login flow.
 */
export default function YouTab() {
  const handleSettings = useCallback(() => {
    router.push('/settings');
  }, []);

  const handleEditProfile = useCallback(() => {
    router.push('/settings/edit-profile');
  }, []);

  const handlePaymentMethods = useCallback(() => {
    router.push('/payment-methods');
  }, []);

  const handleCreateAccount = useCallback(() => {
    router.push('/signup-prompt');
  }, []);

  const handleLoginExisting = useCallback(() => {
    router.push('/login');
  }, []);

  const handleLoggedOut = useCallback(() => {
    // logout() re-bootstraps a fresh guest session before this fires (see
    // authStore.ts), so replace — not push — to the Today tab so the account
    // surface isn't reachable via back from the fresh session.
    router.replace('/today');
  }, []);

  return (
    <YouScreen
      onSettings={handleSettings}
      onEditProfile={handleEditProfile}
      onPaymentMethods={handlePaymentMethods}
      onCreateAccount={handleCreateAccount}
      onLoginExisting={handleLoginExisting}
      onLoggedOut={handleLoggedOut}
    />
  );
}
