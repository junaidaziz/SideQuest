import { router } from 'expo-router';
import { useCallback } from 'react';
import SettingsScreen from '../../src/screens/SettingsScreen';
import { useAuthStore } from '../../src/store/authStore';

export default function SettingsRoute() {
  const logout = useAuthStore((s) => s.logout);

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleAccountSecurity = useCallback(() => {
    router.push('/settings/account-security');
  }, []);

  const handleNotifications = useCallback(() => {
    router.push('/settings/notifications');
  }, []);

  const handleAppearance = useCallback(() => {
    router.push('/settings/appearance');
  }, []);

  const handleAccessibility = useCallback(() => {
    // Appearance and accessibility share one screen in this migration
    // (AppearanceAccessibilityScreen), so both rows open the same route.
    router.push('/settings/appearance');
  }, []);

  const handleLogout = useCallback(async () => {
    // logout() re-bootstraps a fresh guest session, so replace to the Today
    // tab so Settings isn't reachable via back from the fresh session.
    await logout();
    router.replace('/today');
  }, [logout]);

  return (
    <SettingsScreen
      onBack={handleBack}
      onAccountSecurity={handleAccountSecurity}
      onNotifications={handleNotifications}
      onAppearance={handleAppearance}
      onAccessibility={handleAccessibility}
      onLogout={handleLogout}
      // onPrivacy / onData / onHelp / onLegal / onAbout intentionally left
      // unwired: no privacy, data-export, help, legal, or about screens exist
      // in this migration. Documented no-ops.
    />
  );
}
