import { useColorScheme } from 'react-native';
import { CompassColorsDark, CompassColorsLight, type CompassPalette } from '../constants/compassDesign';

/**
 * Resolves the active Compass palette from the OS color scheme.
 * The current shipped app is light-only; this is net-new for screens
 * migrated to the Compass design system.
 */
export function useCompassTheme(): { colors: CompassPalette; scheme: 'light' | 'dark' } {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return { colors: scheme === 'dark' ? CompassColorsDark : CompassColorsLight, scheme };
}
