import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: jest.fn(), setItem: jest.fn() },
}));

import { useThemeStore } from './themeStore';

const STORAGE_KEY = 'sidequest.themePreference';

describe('themeStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useThemeStore.setState({ preference: null });
  });

  describe('hydrate', () => {
    it('restores a previously stored preference', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('dark');
      await useThemeStore.getState().hydrate();
      expect(useThemeStore.getState().preference).toBe('dark');
    });

    it('defaults to system when nothing is stored', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      await useThemeStore.getState().hydrate();
      expect(useThemeStore.getState().preference).toBe('system');
    });

    it('defaults to system for a corrupt/unrecognized stored value', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('sepia');
      await useThemeStore.getState().hydrate();
      expect(useThemeStore.getState().preference).toBe('system');
    });
  });

  describe('setPreference', () => {
    it('updates state immediately and persists the choice', async () => {
      await useThemeStore.getState().setPreference('dark');
      expect(useThemeStore.getState().preference).toBe('dark');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(STORAGE_KEY, 'dark');
    });

    it('persists light and system too', async () => {
      await useThemeStore.getState().setPreference('light');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(STORAGE_KEY, 'light');

      await useThemeStore.getState().setPreference('system');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(STORAGE_KEY, 'system');
    });
  });
});
