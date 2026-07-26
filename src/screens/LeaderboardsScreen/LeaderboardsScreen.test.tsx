import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import LeaderboardsScreen, {
  buildRows,
  meInitial,
  PREVIEW_FRIENDS,
  whenPressed,
} from './LeaderboardsScreen';
import { getHome } from '../../services/homeApi';
import type { HomeResponse } from '../../types/api';

jest.mock('../../services/homeApi');

const mockGetHome = getHome as jest.MockedFunction<typeof getHome>;

const HOME: HomeResponse = {
  level: { level: 6, xpIntoLevel: 0, xpToNextLevel: 100, totalXp: 3000 },
  streak: { currentStreak: 2, longestStreak: 9 },
  dailyMission: null,
  pendingChallenges: [],
  savedPacks: [],
  taskStats: { total: 30, approved: 27, pending: 2, rejected: 1, completionRate: 0.9 },
};

async function renderScreen(overrides: Partial<React.ComponentProps<typeof LeaderboardsScreen>> = {}) {
  const onBack = jest.fn();
  const onOpenWeekPicker = jest.fn();
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const utils = await render(
    <QueryClientProvider client={queryClient}>
      <LeaderboardsScreen onBack={onBack} onOpenWeekPicker={onOpenWeekPicker} displayName="Alex" {...overrides} />
    </QueryClientProvider>,
  );
  return { ...utils, onBack, onOpenWeekPicker };
}

describe('LeaderboardsScreen', () => {
  afterEach(cleanup);

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetHome.mockResolvedValue(HOME);
  });

  describe('pure helpers', () => {
    it('buildRows places the real You row seeded with the users XP and sorts', () => {
      const rows = buildRows(3000, 'A');
      expect(rows).toHaveLength(PREVIEW_FRIENDS.length + 1);
      // 3000 is the highest, so You should sort to rank 1.
      expect(rows[0].isMe).toBe(true);
      expect(rows[0].xp).toBe(3000);
    });

    it('meInitial derives an uppercase initial and falls back', () => {
      expect(meInitial('alex')).toBe('A');
      expect(meInitial('  ')).toBe('★');
      expect(meInitial(null)).toBe('★');
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
      expect(screen.getByLabelText('Loading leaderboards')).toBeTruthy();
    });

    it('renders the preview banner and a real You row', async () => {
      await renderScreen();
      await waitFor(() =>
        expect(screen.getByLabelText(/You, rank 1, 3,000 approved XP \(your real total\)/)).toBeTruthy(),
      );
      expect(screen.getByLabelText(/Leaderboards are a design preview/)).toBeTruthy();
      // A sample friend row is clearly labelled "sample".
      expect(screen.getByLabelText(/Taylor, rank .*sample/)).toBeTruthy();
    });

    it("shows the profile photo on the You row instead of the initial when avatarUrl is set", async () => {
      await renderScreen({ avatarUrl: 'https://cdn.example.test/avatar.jpg' });
      const image = await screen.findByTestId('leaderboard-avatar-me', { includeHiddenElements: true });
      expect(image.props.source).toEqual([{ uri: 'https://cdn.example.test/avatar.jpg' }]);
    });

    it('falls back to the initial on the You row when no avatarUrl is set', async () => {
      await renderScreen({ avatarUrl: null });
      // Wait for the real row data to actually render (not just for the
      // absence of an image, which would also be vacuously true while the
      // query is still loading and no rows exist at all yet).
      await waitFor(() => expect(screen.getByLabelText(/You, rank 1/)).toBeTruthy());
      const youRow = screen.getByLabelText(/You, rank 1/);
      expect(within(youRow).getByText('A')).toBeTruthy();
      expect(screen.queryByTestId('leaderboard-avatar-me')).toBeNull();
    });

    it('renders the error state and retries', async () => {
      mockGetHome.mockRejectedValue(new Error('offline'));
      await renderScreen();
      await waitFor(() => expect(screen.getByText("Couldn't load leaderboards")).toBeTruthy());
      mockGetHome.mockResolvedValue(HOME);
      fireEvent.press(screen.getByLabelText('Try again'));
      await waitFor(() => expect(screen.getByLabelText(/You, rank 1/)).toBeTruthy());
    });
  });

  describe('interactions', () => {
    it('switches scope to Group', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByLabelText('Group')).toBeTruthy());
      fireEvent.press(screen.getByLabelText('Group'));
      await waitFor(() =>
        expect(screen.getByLabelText('Group').props.accessibilityState.selected).toBe(true),
      );
    });

    it('fires onBack and onOpenWeekPicker', async () => {
      const { onBack, onOpenWeekPicker } = await renderScreen();
      fireEvent.press(screen.getByLabelText('Back to progress'));
      fireEvent.press(screen.getByLabelText('Choose week'));
      expect(onBack).toHaveBeenCalledTimes(1);
      expect(onOpenWeekPicker).toHaveBeenCalledTimes(1);
    });
  });

  describe('accessibility', () => {
    it('gives every button and tab a label', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByLabelText(/You, rank 1/)).toBeTruthy());
      [...screen.getAllByRole('button'), ...screen.getAllByRole('tab')].forEach((b) => {
        expect(b.props.accessibilityLabel).toBeTruthy();
      });
    });
  });
});
