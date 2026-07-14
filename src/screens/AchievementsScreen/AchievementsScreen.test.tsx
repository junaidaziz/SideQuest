import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AchievementsScreen, { whenPressed } from './AchievementsScreen';
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

// approved 6 → first-steps(1) & helper(5) earned; explorer(10) in progress; others locked/partial.
const HOME: HomeResponse = {
  level: { level: 2, xpIntoLevel: 30, xpToNextLevel: 70, totalXp: 130 },
  streak: { currentStreak: 3, longestStreak: 5 },
  dailyMission: null,
  pendingChallenges: [],
  savedPacks: [],
  taskStats: { total: 8, approved: 6, pending: 1, rejected: 1, completionRate: 0.75 },
};

async function renderScreen(overrides: Partial<React.ComponentProps<typeof AchievementsScreen>> = {}) {
  const onBack = jest.fn();
  const onOpenAchievement = jest.fn();
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const utils = await render(
    <QueryClientProvider client={queryClient}>
      <AchievementsScreen onBack={onBack} onOpenAchievement={onOpenAchievement} {...overrides} />
    </QueryClientProvider>,
  );
  return { ...utils, onBack, onOpenAchievement };
}

describe('AchievementsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetHome.mockResolvedValue(HOME);
  });

  describe('rendering', () => {
    it('shows the loading skeleton first', async () => {
      mockGetHome.mockReturnValue(new Promise(() => {}));
      await renderScreen();
      expect(screen.getByLabelText('Loading achievements')).toBeTruthy();
    });

    it('renders the earned summary and the grid', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByLabelText(/2 of 8 achievements earned/)).toBeTruthy());
      expect(screen.getByLabelText(/First Steps\./)).toBeTruthy();
    });

    it('renders the error state and retries', async () => {
      mockGetHome.mockRejectedValue(new Error('offline'));
      await renderScreen();
      await waitFor(() => expect(screen.getByText("Couldn't load achievements")).toBeTruthy());
      mockGetHome.mockResolvedValue(HOME);
      fireEvent.press(screen.getByLabelText('Try again'));
      await waitFor(() => expect(screen.getByLabelText(/2 of 8 achievements earned/)).toBeTruthy());
    });
  });

  describe('interactions', () => {
    it('filters to Locked and back', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByLabelText(/First Steps\./)).toBeTruthy());
      fireEvent.press(screen.getByLabelText('Locked filter'));
      // First Steps is earned, so it disappears under the Locked filter.
      await waitFor(() => expect(screen.queryByLabelText(/First Steps\./)).toBeNull());
      fireEvent.press(screen.getByLabelText('All filter'));
      expect(await screen.findByLabelText(/First Steps\./)).toBeTruthy();
    });

    it('shows the empty text when a filter has no matches', async () => {
      const noProgress: HomeResponse = {
        ...HOME,
        streak: { currentStreak: 0, longestStreak: 0 },
        level: { level: 1, xpIntoLevel: 0, xpToNextLevel: 100, totalXp: 0 },
        taskStats: { total: 0, approved: 0, pending: 0, rejected: 0, completionRate: 0 },
      };
      mockGetHome.mockResolvedValue(noProgress);
      await renderScreen();
      await waitFor(() => expect(screen.getByLabelText('Earned filter')).toBeTruthy());
      fireEvent.press(screen.getByLabelText('Earned filter'));
      expect(await screen.findByText(/No achievements in this filter yet/)).toBeTruthy();
    });

    it('opens an achievement detail on card press', async () => {
      const { onOpenAchievement } = await renderScreen();
      await waitFor(() => expect(screen.getByLabelText(/First Steps\./)).toBeTruthy());
      fireEvent.press(screen.getByLabelText(/First Steps\./));
      expect(onOpenAchievement).toHaveBeenCalledWith('first-steps');
    });

    it('invokes onBack from the header', async () => {
      const { onBack } = await renderScreen();
      fireEvent.press(screen.getByLabelText('Back to progress'));
      expect(onBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('accessibility', () => {
    it('gives every button and tab a label', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByLabelText(/First Steps\./)).toBeTruthy());
      [...screen.getAllByRole('button'), ...screen.getAllByRole('tab')].forEach((b) => {
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
