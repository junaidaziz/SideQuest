import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import StreakDetailScreen, { whenPressed } from './StreakDetailScreen';
import { getHome } from '../../services/homeApi';
import type { HomeResponse } from '../../types/api';

jest.mock('react-native-reanimated', () => {
  const { View, Text } = require('react-native');
  const easing = () => 0;
  return {
    __esModule: true,
    default: { View, Text, createAnimatedComponent: (c: unknown) => c },
    useSharedValue: (v: number) => ({ value: v }),
    useAnimatedStyle: (fn: () => unknown) => fn(),
    withTiming: (v: number) => v,
    withRepeat: (v: number) => v,
    Easing: { bezier: () => easing, inOut: () => easing, ease: easing },
  };
});
jest.mock('../../services/homeApi');

const mockGetHome = getHome as jest.MockedFunction<typeof getHome>;

const HOME: HomeResponse = {
  level: { level: 7, xpIntoLevel: 70, xpToNextLevel: 30, totalXp: 720 },
  streak: { currentStreak: 12, longestStreak: 31 },
  dailyMission: null,
  pendingChallenges: [],
  savedPacks: [],
  taskStats: { total: 60, approved: 48, pending: 8, rejected: 4, completionRate: 0.8 },
};

async function renderScreen(overrides: Partial<React.ComponentProps<typeof StreakDetailScreen>> = {}) {
  const onBack = jest.fn();
  const onFindQuest = jest.fn();
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const utils = await render(
    <QueryClientProvider client={queryClient}>
      <StreakDetailScreen onBack={onBack} onFindQuest={onFindQuest} {...overrides} />
    </QueryClientProvider>,
  );
  return { ...utils, onBack, onFindQuest };
}

describe('StreakDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetHome.mockResolvedValue(HOME);
  });

  describe('rendering', () => {
    it('shows the loading skeleton first', async () => {
      mockGetHome.mockReturnValue(new Promise(() => {}));
      await renderScreen();
      expect(screen.getByLabelText('Loading streak')).toBeTruthy();
    });

    it('renders current and longest streak plus the day strip', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByLabelText(/Current streak: 12 days/)).toBeTruthy());
      expect(screen.getByLabelText(/Longest streak: 31 days/)).toBeTruthy();
      expect(screen.getByLabelText(/Activity for the last 14 days\. 12 of the most recent days completed/)).toBeTruthy();
    });

    it('renders the error state and retries', async () => {
      mockGetHome.mockRejectedValue(new Error('offline'));
      await renderScreen();
      await waitFor(() => expect(screen.getByText("Couldn't load streak")).toBeTruthy());
      mockGetHome.mockResolvedValue(HOME);
      fireEvent.press(screen.getByLabelText('Try again'));
      await waitFor(() => expect(screen.getByLabelText(/Current streak: 12 days/)).toBeTruthy());
    });
  });

  describe('interactions', () => {
    it('invokes onBack from the header', async () => {
      const { onBack } = await renderScreen();
      fireEvent.press(screen.getByLabelText('Back to progress'));
      expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('invokes onFindQuest from the CTA', async () => {
      const { onFindQuest } = await renderScreen();
      await waitFor(() => expect(screen.getByLabelText('Find a quick quest for today')).toBeTruthy());
      fireEvent.press(screen.getByLabelText('Find a quick quest for today'));
      expect(onFindQuest).toHaveBeenCalledTimes(1);
    });
  });

  describe('accessibility', () => {
    it('gives every button a label', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByLabelText('Find a quick quest for today')).toBeTruthy());
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
