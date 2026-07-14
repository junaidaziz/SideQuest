import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { Share } from 'react-native';
import ChallengeDetailScreen from '../../src/screens/ChallengeDetailScreen';
import { useAuthStore } from '../../src/store/authStore';

export default function ChallengeDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const currentUserId = useAuthStore((s) => s.user?.id);

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleShareInvite = useCallback((inviteUrl: string) => {
    Share.share({ message: inviteUrl }).catch(() => {});
  }, []);

  if (!id) {
    return <Redirect href="/challenges" />;
  }

  return (
    <ChallengeDetailScreen
      taskId={id}
      currentUserId={currentUserId}
      onBack={handleBack}
      onShareInvite={handleShareInvite}
      // onSubmitEvidence intentionally left unwired: the evidence-submission
      // flow (needs a dedicated photo-picker screen) is out of scope for this
      // migration. Documented no-op.
    />
  );
}
