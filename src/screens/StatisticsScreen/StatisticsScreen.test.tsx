import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import StatisticsScreen, {
  buildStats,
  completionPercent,
  levelProgress,
  whenPressed,
} from './StatisticsScreen';
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
  level: { level: 3, xpIntoLevel: 40, xpToNextLevel: 60, totalXp: 1240 },
  streak: { currentStreak: 7, longestStreak: 12 },
  dailyMission: null,
  pendingChallenges: [],
  savedPacks: [],
  taskStats: { total: 20, approved: 17, pending: 2, rejected: 1, completionRate: 0.85 },
};

async function renderScreen(overrides: Partial<React.ComponentProps<typeof StatisticsScreen>> = {}) {
  const onBack = jest.fn();
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const utils = await render(
    <QueryClientProvider client={queryClient}>
      <StatisticsScreen onBack={onBack} {...overrides} />
    </QueryClientProvider>,
  );
  return { ...utils, onBack };
}

describe('StatisticsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetHome.mockResolvedValue(HOME);
  });

  describe('pure helpers', () => {
    it('buildStats maps real home fields to tiles', () => {
      const stats = buildStats(HOME);
      expect(stats.find((s) => s.key === 'xp')?.value).toBe('1,240');
      expect(stats.find((s) => s.key === 'level')?.value).toBe('3');
      expect(stats.find((s) => s.key === 'approved')?.value).toBe('17');
    });

    it('completionPercent rounds the 0-1 rate', () => {
      expect(completionPercent(HOME)).toBe(85);
      expect(completionPercent({ ...HOME, taskStats: { ...HOME.taskStats, completionRate: 0 } })).toBe(0);
    });

    it('levelProgress guards a zero span', () => {
      expect(levelProgress(HOME)).toBeCloseTo(0.4);
      const zero = { ...HOME, level: { level: 1, xpIntoLevel: 0, xpToNextLevel: 0, totalXp: 0 } };
      expect(levelProgress(zero)).toBe(0);
    });

    it('whenPressed returns style only when pressed', () => {
      const s = { opacity: 0.5 };
      expect(whenPressed(true, s)).toBe(s);
      expect(whenPressed(false, s)).toBeNull();
    });
  });

  describe('rendering', () => {
    it('shows the loading skeleton first', async () => {
      mockGetHome.mockReturnValue(new Promise(() => {}));
      await renderScreen();
      expect(screen.getByLabelText('Loading statistics')).toBeTruthy();
    });

    it('renders real metric tiles and completion rate', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByLabelText('1,240 Total XP')).toBeTruthy());
      expect(screen.getByLabelText('Completion rate 85 percent')).toBeTruthy();
      expect(screen.getByLabelText(/17 of 20 completions approved/)).toBeTruthy();
    });

    it('renders the honesty footnote about omitted breakdowns', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByText(/Weekly, by-category, and time-of-day/)).toBeTruthy());
    });

    it('renders the error state and retries', async () => {
      mockGetHome.mockRejectedValue(new Error('offline'));
      await renderScreen();
      await waitFor(() => expect(screen.getByText("Couldn't load statistics")).toBeTruthy());
      mockGetHome.mockResolvedValue(HOME);
      fireEvent.press(screen.getByLabelText('Try again'));
      await waitFor(() => expect(screen.getByLabelText('1,240 Total XP')).toBeTruthy());
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
      await waitFor(() => expect(screen.getByLabelText('1,240 Total XP')).toBeTruthy());
      screen.getAllByRole('button').forEach((b) => {
        expect(b.props.accessibilityLabel).toBeTruthy();
      });
    });
  });
});
