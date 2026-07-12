import { router } from 'expo-router';
import { useCallback } from 'react';
import SignupPromptScreen from '../src/screens/SignupPromptScreen';

/**
 * Standalone route for the guest-completion-limit gate reached mid proof
 * submission (see app/proof-submission/[missionId].tsx). CompletionScreen
 * has its own separate embedded-Modal usage of this same component for its
 * post-completion save/challenge gate, with real XP/streak numbers to show
 * instead of this route's defaults.
 *
 * Both outcomes return to the proof-submission screen: on success the
 * guest's session was upgraded to a full account in place (same JWT
 * subject, same backend User row), so the guest-completion gate no longer
 * applies and the user can press Submit again; on dismiss they explicitly
 * chose not to sign up and stay blocked, which is also the correct place
 * for that choice to land.
 */
export default function SignupPromptRoute() {
  const handleDone = useCallback(() => {
    router.back();
  }, []);

  return <SignupPromptScreen onSuccess={handleDone} onDismiss={handleDone} />;
}
