import { router, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import ProofSubmissionScreen from '../../src/screens/ProofSubmissionScreen';
import type { ProofSubmissionResponse } from '../../src/types/api';

export default function ProofSubmissionRoute() {
  const { missionId, proofRequirement } = useLocalSearchParams<{
    missionId: string;
    proofRequirement: string;
  }>();

  const handleSubmitSuccess = useCallback((result: ProofSubmissionResponse) => {
    // replace, not push — a completed submission shouldn't leave the proof
    // form reachable via the hardware/gesture back button.
    router.replace({ pathname: '/completion', params: { result: JSON.stringify(result) } });
  }, []);

  const handleCancel = useCallback(() => {
    router.back();
  }, []);

  const handleGuestLimitReached = useCallback(() => {
    // The guest hit the one-free-completion gate before ever finishing a
    // quest, so there's no result/streak to show yet — the signup sheet's
    // own defaults (40 XP, 3-day streak) are the right framing here, unlike
    // CompletionScreen's post-completion gate which has real numbers.
    router.push('/signup-prompt');
  }, []);

  return (
    <ProofSubmissionScreen
      missionId={missionId}
      proofRequirement={proofRequirement}
      onSubmitSuccess={handleSubmitSuccess}
      onCancel={handleCancel}
      onGuestLimitReached={handleGuestLimitReached}
    />
  );
}
