import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LevelDetailScreen, { whenPressed, xpRemainingToUnlock } from './LevelDetailScreen';
import { getHome } from '../../services/homeApi';
import type { HomeResponse } from '../../types/api';
import type { LevelNode } from '../ProgressOverviewScreen/levels';

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

async function renderScreen(onBack = jest.fn(), onFindQuest = jest.fn()) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const utils = await render(
    <QueryClientProvider client={queryClient}>
      <LevelDetailScreen onBack={onBack} onFindQuest={onFindQuest} />
    </QueryClientProvider>,
  );
  return { ...utils, onBack, onFindQuest };
}

describe('LevelDetailScreen', () => {
  afterEach(cleanup);
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

    it('does not react to tapping a reached (non-locked) node', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByLabelText(/Level 6, Pioneer\./)).toBeTruthy());
      // Reached nodes render with accessibilityRole "text", not "button" —
      // there's nothing to press, so no tooltip should ever appear.
      expect(screen.getByLabelText(/Level 6, Pioneer\./).props.accessibilityRole).toBe('text');
      expect(screen.queryByText('Got it')).toBeNull();
    });
  });

  describe('locked-level tooltip', () => {
    it('opens with XP required, XP remaining, and the rank blurb on tap', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByLabelText(/Level 9, Navigator\. .*Tap for details/)).toBeTruthy());
      await fireEvent.press(screen.getByLabelText(/Level 9, Navigator\. .*Tap for details/));

      await waitFor(() => expect(screen.getByText('Level 9 · Navigator')).toBeTruthy());
      // xpForLevel(9) = 800; HOME.level.totalXp = 720 → 80 XP remaining.
      expect(screen.getByText('800')).toBeTruthy();
      expect(screen.getByText('80')).toBeTruthy();
    });

    it('closes via "Got it"', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByLabelText(/Level 9, Navigator\./)).toBeTruthy());
      await fireEvent.press(screen.getByLabelText(/Level 9, Navigator\./));
      await waitFor(() => expect(screen.getByLabelText('Got it, close')).toBeTruthy());

      await fireEvent.press(screen.getByLabelText('Got it, close'));
      await waitFor(() => expect(screen.queryByLabelText('Got it, close')).toBeNull());
    });

    // The backdrop Pressable is deliberately hidden from the accessibility
    // tree (accessibilityElementsHidden, matching AccountSecurityScreen's
    // identical backdrop pattern) so a screen reader user tabbing through the
    // sheet never lands on an invisible full-screen tap target — the same
    // reason AccountSecurityScreen's own tests don't exercise its backdrop
    // tap either. It shares handleCloseLockedTooltip with "Got it" above, so
    // that test already covers the close behavior itself.

    it('"Find a quest" calls onFindQuest and closes the tooltip', async () => {
      const { onFindQuest } = await renderScreen();
      await waitFor(() => expect(screen.getByLabelText(/Level 9, Navigator\./)).toBeTruthy());
      await fireEvent.press(screen.getByLabelText(/Level 9, Navigator\./));
      await waitFor(() => expect(screen.getByLabelText('Find a quest to earn XP')).toBeTruthy());

      await fireEvent.press(screen.getByLabelText('Find a quest to earn XP'));
      expect(onFindQuest).toHaveBeenCalledTimes(1);
      await waitFor(() => expect(screen.queryByLabelText('Find a quest to earn XP')).toBeNull());
    });
  });

  describe('xpRemainingToUnlock', () => {
    it('returns the gap between the node threshold and current total XP', () => {
      const node: LevelNode = { level: 9, name: 'Navigator', xp: 800, status: 'locked' };
      expect(xpRemainingToUnlock(node, 720)).toBe(80);
    });

    it('clamps at 0 rather than going negative', () => {
      const node: LevelNode = { level: 8, name: 'Cartographer', xp: 700, status: 'locked' };
      expect(xpRemainingToUnlock(node, 720)).toBe(0);
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
