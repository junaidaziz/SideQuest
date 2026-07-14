import { router } from 'expo-router';
import { useCallback } from 'react';
import VerificationDetailScreen from '../../src/screens/VerificationDetailScreen';

/**
 * Verification detail. There is no backend GET for a single verification yet,
 * so this route resolves no `detail` — VerificationDetailScreen renders its
 * unavailable/empty state. The completionId param is captured for when that
 * endpoint lands; the screen's own placeholder content covers the interim.
 */
export default function VerificationDetailRoute() {
  const handleBack = useCallback(() => {
    router.back();
  }, []);

  return (
    <VerificationDetailScreen
      onBack={handleBack}
      // onHelp / onRequestUpdate / onDelete / onResubmit / onRetry intentionally
      // left unwired: their target flows (help center, resubmit-with-new-proof,
      // delete-completion) have no screen or endpoint in this migration.
      // Documented no-ops.
    />
  );
}
