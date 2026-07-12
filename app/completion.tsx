import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo } from 'react';
import CompletionScreen from '../src/screens/CompletionScreen';
import { useAuthStore } from '../src/store/authStore';
import type { ProofSubmissionResponse } from '../src/types/api';

export default function CompletionRoute() {
  const { result: resultParam } = useLocalSearchParams<{ result: string }>();
  // Set by app/proof-submission/[missionId].tsx's router.replace, but a
  // cold-start deep link straight into this route (no result param, or a
  // malformed one) is still reachable in principle — there's no in-progress
  // quest to resume in that case, so Home is the safe fallback rather than
  // crashing on JSON.parse.
  const result = useMemo<ProofSubmissionResponse | null>(() => {
    if (!resultParam) return null;
    try {
      return JSON.parse(resultParam) as ProofSubmissionResponse;
    } catch {
      return null;
    }
  }, [resultParam]);
  const isGuest = useAuthStore((state) => state.user?.isGuest ?? true);

  const handleFindAnotherQuest = useCallback(() => {
    // Mode Select (screen 07, "entry variant" in the mockups) was designed
    // as the intended shortcut here instead of the full onboarding wizard,
    // but its 8 quest modes don't map cleanly onto the crew/time/setting/
    // budget filters the backend expects — "solo"/"couple"/"family" map to
    // a crew value fine, but "city"/"confidence"/"travel" don't correspond
    // to any existing filter dimension. Routing through onboarding again is
    // slower but always produces a valid, correctly-matched request; wiring
    // Mode Select needs a product decision on that mapping first.
    router.replace('/onboarding');
  }, []);

  const handleChallengeSent = useCallback(() => {
    router.replace('/home');
  }, []);

  if (!result) {
    return <Redirect href="/home" />;
  }

  return (
    <CompletionScreen
      result={result}
      isGuest={isGuest}
      onFindAnotherQuest={handleFindAnotherQuest}
      onChallengeSent={handleChallengeSent}
    />
  );
}
