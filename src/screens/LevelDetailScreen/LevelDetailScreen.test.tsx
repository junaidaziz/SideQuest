import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LevelDetailScreen, { whenPressed } from './LevelDetailScreen';
import { getHome } from '../../services/homeApi';
import type { HomeResponse } from '../../types/api';

jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: { View, createAnimatedComponent: (c: unknown) => c },
    useSharedValue: (v: number) => ({ value: v }),
    useAnimatedStyle: (fn: () => unknown) => fn(),
    withTiming: (v: number) => v,
    Easing: { bezier: () => () => 0 },
  };
});
jest.mock('../../services/homeApi');

const mockGetHome = getHome as jest.MockedFunction<typeof getHome>;

const HOME: HomeResponse = {
  level: { level: 7, xpIntoLevel: 70, xpToNextLevel: 30, totalXp: 720 },
  streak: { currentStreak: 12, longestStreak: 20 },
  dailyMission: null,
  pendingChallenges: [],
  savedPacks: [],
  taskStats: { total: 60, approved: 48, pending: 8, rejected: 4, completionRate: 0.8 },
};

async function renderScreen(onBack = jest.fn()) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const utils = await render(
    <QueryClientProvider client={queryClient}>
      <LevelDetailScreen onBack={onBack} />
    </QueryClientProvider>,
  );
  return { ...utils, onBack };
}

describe('LevelDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetHome.mockResolvedValue(HOME);
  });

  describe('rendering', () => {
    it('shows the loading skeleton first', async () => {
      mockGetHome.mockReturnValue(new Promise(() => {}));
      await renderScreen();
      expect(screen.getByLabelText('Loading level')).toBeTruthy();
    });

    it('renders rank, blurb and the level map', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByText('LEVEL 7')).toBeTruthy());
      expect(screen.getByText('LEVEL 7')).toBeTruthy();
      // current + up to two above + one below => includes Cartographer node label
      expect(screen.getByLabelText(/Level 8, Cartographer/)).toBeTruthy();
      expect(screen.getByLabelText(/Level 6, Pioneer\. Reached/)).toBeTruthy();
    });

    it('renders the error state and retries', async () => {
      mockGetHome.mockRejectedValue(new Error('offline'));
      await renderScreen();
      await waitFor(() => expect(screen.getByText("Couldn't load level")).toBeTruthy());
      mockGetHome.mockResolvedValue(HOME);
      fireEvent.press(screen.getByLabelText('Try again'));
      await waitFor(() => expect(screen.getByText('LEVEL 7')).toBeTruthy());
    });
  });

  describe('interactions', () => {
    it('invokes onBack from the header', async () => {
      const { onBack } = await renderScreen();
      fireEvent.press(screen.getByLabelText('Back to progress'));
      expect(onBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('accessibility', () => {
    it('gives every button a label', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByText('LEVEL 7')).toBeTruthy());
      screen.getAllByRole('button').forEach((b) => {
        expect(b.props.accessibilityLabel).toBeTruthy();
      });
    });
  });

  describe('whenPressed', () => {
    it('returns style only when pressed', () => {
      const s = { opacity: 0.5 };
      expect(whenPressed(true, s)).toBe(s);
      expect(whenPressed(false, s)).toBeNull();
    });
  });
});
