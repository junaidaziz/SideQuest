import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemePreference = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'sidequest.themePreference';

interface ThemeState {
  /** Null until hydrate() resolves, so useCompassTheme() can fall back to the
   * OS scheme for the one frame before the stored preference loads instead of
   * flashing a wrong theme. */
  preference: ThemePreference | null;
  hydrate: () => Promise<void>;
  setPreference: (next: ThemePreference) => Promise<void>;
}

/**
 * App-wide theme override, independent of `useColorScheme()`. Every Compass
 * screen reads the resolved palette through `useCompassTheme()`, which
 * combines this store's `preference` with the OS scheme — so a change here
 * re-renders every subscribed screen immediately (Zustand's normal
 * subscription behavior), with no reload and no flicker.
 */
export const useThemeStore = create<ThemeState>((set) => ({
  preference: null,

  hydrate: async () => {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    const preference: ThemePreference =
      stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
    set({ preference });
  },

  setPreference: async (next) => {
    set({ preference: next });
    await AsyncStorage.setItem(STORAGE_KEY, next);
  },
}));
