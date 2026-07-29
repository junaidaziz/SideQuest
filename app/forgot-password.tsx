import { router } from 'expo-router';
import { useCallback } from 'react';
import ForgotPasswordScreen from '../src/screens/ForgotPasswordScreen';
import { forgotPassword } from '../src/services/authApi';

/**
 * Standalone route for the "request a password-reset email" flow, reached from
 * LoginScreen's "Forgot password?" link. The screen is presentational; this
 * route owns navigation and the actual network call (same pattern as
 * app/settings/account-security.tsx wiring authApi behind the screen).
 *
 * The backend's `POST /auth/forgot-password` always resolves with a generic
 * success response whether or not the email maps to an account — the screen
 * relies on that (it shows one identical confirmation for every accepted
 * submit). A thrown error here is a transport/server fault, which the screen
 * surfaces as a generic retry banner. The reset link the backend emails points
 * at a WEB page, not a mobile deep link, so there is no in-app token-
 * consumption step to wire — mobile's job ends at requesting the email.
 */
export default function ForgotPasswordRoute() {
  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleSubmit = useCallback(async (email: string) => {
    await forgotPassword({ email });
  }, []);

  return <ForgotPasswordScreen onSubmit={handleSubmit} onBack={handleBack} />;
}
