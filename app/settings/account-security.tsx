import { router } from 'expo-router';
import { useCallback, useEffect } from 'react';
import AccountSecurityScreen from '../../src/screens/AccountSecurityScreen';
import { changePassword, deleteAccount } from '../../src/services/authApi';
import { ApiError } from '../../src/services/apiClient';
import { useAuthStore } from '../../src/store/authStore';

export default function AccountSecurityRoute() {
  // Same primary-checkpoint pattern as app/payment-methods.tsx: a guest
  // reaching this route (deep link, manual navigation) is redirected before
  // the screen ever mounts, rather than relying solely on the You tab's
  // entry point being hidden. `?? true` treats "no user yet" (still
  // hydrating) as guest-like so nothing flashes before hydrate() resolves.
  const isGuest = useAuthStore((s) => s.user?.isGuest ?? true);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    if (isGuest) {
      router.replace('/today');
    }
  }, [isGuest]);

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleChangePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    await changePassword({ currentPassword, newPassword });
    // The backend revokes the refresh token on password change. Clear every
    // local auth/cache artifact immediately instead of leaving a session that
    // fails unexpectedly only when its access token later expires.
    await logout();
    router.replace('/today');
  }, [logout]);

  const handleDeleteAccount = useCallback(async (password: string) => {
    // This route's guest guard above means every account reaching here has
    // at least attempted a full signup, so a password is the expected path.
    // A Google-only account (no password to verify) would need a
    // confirm:true path this screen's UI doesn't yet expose — a known,
    // pre-existing gap in the screen's own form (not introduced by this
    // wiring), left for a follow-up UI pass rather than reworked here.
    try {
      await deleteAccount({ currentPassword: password });
    } catch (error) {
      // Google-only accounts have no password. The destructive checkbox is
      // already checked before this callback can run; retry with the backend's
      // explicit confirmation shape only when it identifies that exact case.
      if (error instanceof ApiError && error.status === 400 && error.message.includes('confirm=true')) {
        await deleteAccount({ confirm: true });
        return;
      }
      throw error;
    }
  }, []);

  const handleDeleted = useCallback(async () => {
    // The account row is soft-deleted server-side and its refresh token
    // already revoked, but this device's local session/tokens are still
    // held in memory and secure storage — clear them the same way logout()
    // always does, then land on the Today tab where hydrate() bootstraps a
    // fresh guest session.
    await logout();
    router.replace('/today');
  }, [logout]);

  if (isGuest) {
    return null;
  }

  return (
    <AccountSecurityScreen
      onBack={handleBack}
      onChangePassword={handleChangePassword}
      onDeleteAccount={handleDeleteAccount}
      onDeleted={handleDeleted}
      // onChangeEmail / onDownloadData / onSignOutOtherDevices intentionally
      // left unwired: no change-email, data-export, or session-management
      // screens/endpoints exist in this migration.
    />
  );
}
