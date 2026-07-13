import { router } from 'expo-router';
import { useCallback } from 'react';
import SignupPromptScreen from '../src/screens/SignupPromptScreen';

/**
 * Standalone route for any "create an account" entry point that isn't the
 * post-completion save/challenge gate — currently reached from the
 * guest-completion-limit gate mid proof submission (see
 * app/proof-submission/[missionId].tsx) and from Profile's guest-state
 * "Create an account" CTA (see app/profile.tsx). CompletionScreen has its
 * own separate embedded-Modal usage of this same component for the
 * post-completion gate specifically, with real XP/streak numbers to show
 * instead of this route's defaults.
 *
 * Both outcomes navigate back to whichever screen pushed this route: on
 * success the guest's session was upgraded to a full account in place (same
 * JWT subject, same backend User row), so the caller's own state reflects
 * the change on return (e.g. the proof-submission gate no longer applies;
 * Profile now shows the signed-in view); on dismiss the user explicitly
 * chose not to sign up, which is also the correct place for that choice to
 * land.
 */
export default function SignupPromptRoute() {
  const handleDone = useCallback(() => {
    router.back();
  }, []);

  return <SignupPromptScreen onSuccess={handleDone} onDismiss={handleDone} />;
}
