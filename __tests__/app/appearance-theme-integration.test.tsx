import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppearanceRoute from '../../app/settings/appearance';
import { useThemeStore } from '../../src/store/themeStore';

// Real store, real screen — only expo-router and the native AsyncStorage
// module are mocked. This reproduces the exact remount-via-`key` interaction
// between AppearanceRoute and AppearanceAccessibilityScreen that the unit
// tests (which mock useThemeStore entirely) can't catch.
jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() } }));

const mockStorageBacking = new Map<string, string>();
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn((key: string) => Promise.resolve(mockStorageBacking.get(key) ?? null)),
    setItem: jest.fn((key: string, value: string) => {
      mockStorageBacking.set(key, value);
      return Promise.resolve();
    }),
  },
}));

describe('Appearance theme — real store + real screen integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorageBacking.clear();
    useThemeStore.setState({ preference: null });
  });

  it('persists a tapped theme choice, and it survives a fresh hydrate (simulating app restart)', async () => {
    const { getByLabelText } = await render(<AppearanceRoute />);

    await fireEvent.press(getByLabelText('Dark theme'));

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('sidequest.themePreference', 'dark');
    });

    // Simulate an app restart: fresh store state, re-run hydrate(), and
    // confirm it reads back what was actually persisted — not something else.
    useThemeStore.setState({ preference: null });
    await useThemeStore.getState().hydrate();
    expect(useThemeStore.getState().preference).toBe('dark');
  });

  it('does not re-persist a stale value when other settings change after a theme pick', async () => {
    const { getByLabelText } = await render(<AppearanceRoute />);

    await fireEvent.press(getByLabelText('Dark theme'));
    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('sidequest.themePreference', 'dark');
    });
    (AsyncStorage.setItem as jest.Mock).mockClear();

    // Toggling an unrelated setting (Reduce motion) must not touch the
    // persisted theme value at all.
    await fireEvent.press(getByLabelText('Reduce motion'));

    expect(AsyncStorage.setItem).not.toHaveBeenCalledWith('sidequest.themePreference', expect.anything());
  });
});
