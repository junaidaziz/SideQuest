import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo } from 'react';
import CompletionScreenV2 from '../src/screens/CompletionScreenV2';
import { useAuthStore } from '../src/store/authStore';
import type { ProofSubmissionResponse } from '../src/types/api';

/**
 * Quest completion (Compass V2). Reached via router.replace from the proof
 * route. A cold-start deep link with no/invalid result has no completion to
 * celebrate, so it falls back to the Today tab.
 */
export default function CompletionRoute() {
  const { result: resultParam } = useLocalSearchParams<{ result: string }>();
  const result = useMemo<ProofSubmissionResponse | null>(() => {
    if (!resultParam) return null;
    try {
      return JSON.parse(resultParam) as ProofSubmissionResponse;
    } catch {
      return null;
    }
  }, [resultParam]);
  const isGuest = useAuthStore((state) => state.user?.isGuest ?? true);

  const handleBackToToday = useCallback(() => {
    router.replace('/today');
  }, []);

  const handleOpenNextIdea = useCallback(() => {
    router.replace('/explore');
  }, []);

  const handleCreateAccount = useCallback(() => {
    router.push('/signup-prompt');
  }, []);

  if (!result) {
    return <Redirect href="/today" />;
  }

  return (
    <CompletionScreenV2
      result={result}
      isGuest={isGuest}
      onBackToToday={handleBackToToday}
      onOpenNextIdea={handleOpenNextIdea}
      onCreateAccount={handleCreateAccount}
      // onShare intentionally left unwired: no share-sheet integration is
      // defined for this migration. Documented no-op.
    />
  );
}
