import { Redirect, useLocalSearchParams } from 'expo-router';

/**
 * Retired route — superseded by /proof/[missionId] (ProofSubmissionScreenV2)
 * in the Compass redesign. Kept as a forwarding redirect (not deleted) so any
 * external/deep link still pointing at the old path preserves its params into
 * the new screen. The old ProofSubmissionScreen source is preserved under
 * src/screens/ProofSubmissionScreen for rollback.
 */
export default function ProofSubmissionRoute() {
  const { missionId, proofRequirement } = useLocalSearchParams<{
    missionId: string;
    proofRequirement: string;
  }>();

  if (!missionId) {
    return <Redirect href="/explore" />;
  }
  return (
    <Redirect
      href={{ pathname: '/proof/[missionId]', params: { missionId, proofRequirement } }}
    />
  );
}
