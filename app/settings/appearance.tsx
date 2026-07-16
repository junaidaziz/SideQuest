import { router } from 'expo-router';
import { useCallback, useMemo } from 'react';
import AppearanceAccessibilityScreen, {
  DEFAULT_APPEARANCE_SETTINGS,
  type AppearanceSettings,
  type ThemeChoice,
} from '../../src/screens/AppearanceAccessibilityScreen';
import { useThemeStore } from '../../src/store/themeStore';

export default function AppearanceRoute() {
  const preference = useThemeStore((s) => s.preference);
  const setPreference = useThemeStore((s) => s.setPreference);

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  // `preference` is null for one frame before hydrate() resolves — fall back
  // to the screen's own 'system' default rather than flashing an unselected
  // radio group. The `key` below forces a remount when this changes (e.g.
  // once hydrate() resolves a stored value) so the screen's local state
  // re-syncs instead of staying locked to whatever it first mounted with.
  const initialSettings: AppearanceSettings = useMemo(
    () => ({ ...DEFAULT_APPEARANCE_SETTINGS, theme: preference ?? 'system' }),
    [preference],
  );

  // Theme picks go straight to the store — deliberately not routed through
  // the generic onChange (see AppearanceAccessibilityScreen's prop doc for
  // why: that coupling previously let an unrelated toggle re-persist a
  // stale local theme value and silently revert a real theme choice).
  const handleThemeChange = useCallback(
    (theme: ThemeChoice) => {
      void setPreference(theme);
    },
    [setPreference],
  );

  return (
    <AppearanceAccessibilityScreen
      key={preference ?? 'system'}
      onBack={handleBack}
      initialSettings={initialSettings}
      onThemeChange={handleThemeChange}
      // onChange left unwired: no other Appearance setting (motion/haptics/
      // sound/contrast) is persisted anywhere yet.
      // onOpenTextSettings left unwired: no OS deep-link is defined here.
    />
  );
}
