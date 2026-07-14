import { router } from 'expo-router';
import { useCallback } from 'react';
import { Share } from 'react-native';
import CreateChallengeScreen from '../../src/screens/CreateChallengeScreen';

export default function CreateChallengeRoute() {
  const handleCancel = useCallback(() => {
    router.back();
  }, []);

  const handleCreated = useCallback((taskId: string) => {
    // replace, not push — after sending, the create wizard shouldn't be
    // reachable via back from the new challenge's detail.
    router.replace({ pathname: '/challenges/[id]', params: { id: taskId } });
  }, []);

  const handleShareInvite = useCallback((inviteUrl: string) => {
    Share.share({ message: inviteUrl }).catch(() => {});
  }, []);

  return (
    <CreateChallengeScreen
      onCancel={handleCancel}
      onCreated={handleCreated}
      onShareInvite={handleShareInvite}
    />
  );
}
