import { useColorScheme } from 'react-native';
import { CompassColorsDark, CompassColorsLight, type CompassPalette } from '../constants/compassDesign';
import { useThemeStore } from '../store/themeStore';

/**
 * Resolves the active Compass palette from the user's theme preference
 * (Settings > Appearance), falling back to the OS color scheme for
 * `'system'` (the default, and whatever `preference` is before
 * `useThemeStore.hydrate()` resolves at launch). Every screen calling this
 * hook re-renders immediately when the preference changes — Zustand's normal
 * subscription behavior — so switching themes never needs an app restart.
 */
export function useCompassTheme(): { colors: CompassPalette; scheme: 'light' | 'dark' } {
  const osScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const preference = useThemeStore((s) => s.preference);
  const scheme = preference === 'light' || preference === 'dark' ? preference : osScheme;
  return { colors: scheme === 'dark' ? CompassColorsDark : CompassColorsLight, scheme };
}
