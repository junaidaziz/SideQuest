import { router } from 'expo-router';
import { useCallback } from 'react';
import LoginScreen from '../src/screens/LoginScreen';

export default function LoginRoute() {
  const handleSuccess = useCallback(() => {
    // Compass redesign: land in the tab structure (Today tab) after a
    // successful sign-in, not the retired /home route. replace — not push —
    // so Login isn't reachable via back from the signed-in session.
    router.replace('/today');
  }, []);

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleGoToSignup = useCallback(() => {
    router.replace('/signup-prompt');
  }, []);

  const handleGoToForgotPassword = useCallback(() => {
    // push — not replace — so the user can back out of the reset request and
    // land right back on this login screen with their email still typed.
    router.push('/forgot-password');
  }, []);

  return (
    <LoginScreen
      onSuccess={handleSuccess}
      onBack={handleBack}
      onGoToSignup={handleGoToSignup}
      onGoToForgotPassword={handleGoToForgotPassword}
    />
  );
}
