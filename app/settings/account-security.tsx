import { router } from 'expo-router';
import { useCallback } from 'react';
import AccountSecurityScreen from '../../src/screens/AccountSecurityScreen';

export default function AccountSecurityRoute() {
  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleDeleted = useCallback(() => {
    // After account deletion the session is gone; replace to the Today tab,
    // where hydrate() will bootstrap a fresh guest session.
    router.replace('/today');
  }, []);

  return (
    <AccountSecurityScreen
      onBack={handleBack}
      onDeleted={handleDeleted}
      // onChangeEmail / onDownloadData / onSignOutOtherDevices intentionally
      // left unwired: no change-email, data-export, or session-management
      // screens/endpoints exist in this migration. onChangePassword /
      // onDeleteAccount are left as the screen's own resolved-no-op defaults
      // (their PATCH/DELETE endpoints don't exist yet — see the screen's TODOs).
    />
  );
}
