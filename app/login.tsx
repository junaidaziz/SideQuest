import { router } from 'expo-router';
import { useCallback } from 'react';
import LoginScreen from '../src/screens/LoginScreen';

export default function LoginRoute() {
  const handleSuccess = useCallback(() => {
    // Known, accepted minor back-stack seam: reached via Home -> Profile ->
    // Login, this replace leaves [Home, Profile, Home] on the stack rather
    // than collapsing back to a single Home — pressing back from here twice
    // lands on Profile (now correctly showing the signed-in state) then the
    // original Home, rather than exiting straight away. Not fixed with a
    // stack-reset API (dismissAll/dismissTo) since neither could be
    // exercised against a live simulator in this environment to confirm it
    // doesn't behave unexpectedly; this is a cosmetic hygiene issue with no
    // dead-end or crash, not worth the risk of an unverified navigation fix.
    router.replace('/home');
  }, []);

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleGoToSignup = useCallback(() => {
    router.replace('/signup-prompt');
  }, []);

  return (
    <LoginScreen onSuccess={handleSuccess} onBack={handleBack} onGoToSignup={handleGoToSignup} />
  );
}
