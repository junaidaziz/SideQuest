import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { Share } from 'react-native';
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

  const handleShare = useCallback(() => {
    // Same RN Share API used for challenge/rewards invite links elsewhere in
    // this migration — a real action, not the silent no-op an independent
    // review found here (a labelled, announced button that did nothing on
    // the app's single most emotionally significant screen).
    if (!result) return;
    Share.share({
      message: `I just completed "${result.missionTitle}" on SideQuest and earned ${result.xpAwarded} XP! \u{1F3C6}`,
    }).catch(() => {});
  }, [result]);

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
      onShare={handleShare}
    />
  );
}
