import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return { LinearGradient: View };
});
jest.mock('../../services/homeApi');
jest.mock('../../services/referralsApi');

import RewardsScreen, {
  formatShortDate,
  toRewards,
  whenPressed,
} from './RewardsScreen';
import { getHome } from '../../services/homeApi';
import { getReferralHistory, getReferralMe } from '../../services/referralsApi';
import type { HomeResponse, PaginatedReferralHistory, ReferralMe } from '../../types/api';

const mockGetHome = getHome as jest.MockedFunction<typeof getHome>;
const mockGetMe = getReferralMe as jest.MockedFunction<typeof getReferralMe>;
const mockGetHistory = getReferralHistory as jest.MockedFunction<typeof getReferralHistory>;

const HOME: HomeResponse = {
  level: { level: 3, xpIntoLevel: 40, xpToNextLevel: 60, totalXp: 1240 },
  streak: { currentStreak: 7, longestStreak: 12 },
  dailyMission: null,
  pendingChallenges: [],
  savedPacks: [],
  taskStats: { total: 20, approved: 17, pending: 2, rejected: 1, completionRate: 0.85 },
};

const ME: ReferralMe = {
  code: 'H7KMNP34',
  inviteUrl: 'sidequest://referrals/invite/H7KMNP34',
  totalReferrals: 3,
  completedReferrals: 1,
  pendingReferrals: 2,
  invitesSent: 5,
  rewardsEarnedXp: 50,
};

const HISTORY: PaginatedReferralHistory = {
  items: [
    {
      id: 'ref-1',
      refereeId: 'u1',
      status: 'Completed',
      code: 'H7KMNP34',
      registeredAt: '2026-07-01T10:00:00.000Z',
      completedAt: '2026-07-02T10:00:00.000Z',
      createdAt: '2026-07-01T10:00:00.000Z',
      rewardXp: 50,
    },
    {
      id: 'ref-2',
      refereeId: 'u2',
      status: 'Pending',
      code: 'H7KMNP34',
      registeredAt: '2026-07-05T10:00:00.000Z',
      completedAt: null,
      createdAt: '2026-07-05T10:00:00.000Z',
      rewardXp: null,
    },
  ],
  total: 2,
  limit: 20,
  offset: 0,
};

async function renderScreen(overrides: Partial<React.ComponentProps<typeof RewardsScreen>> = {}) {
  const onBack = jest.fn();
  const onShareInvite = jest.fn();
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const utils = await render(
    <QueryClientProvider client={queryClient}>
      <RewardsScreen onBack={onBack} onShareInvite={onShareInvite} {...overrides} />
    </QueryClientProvider>,
  );
  return { ...utils, onBack, onShareInvite };
}

describe('RewardsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetHome.mockResolvedValue(HOME);
    mockGetMe.mockResolvedValue(ME);
    mockGetHistory.mockResolvedValue(HISTORY);
  });

  describe('pure helpers', () => {
    it('formatShortDate returns null for null/invalid', () => {
      expect(formatShortDate(null)).toBeNull();
      expect(formatShortDate('not-a-date')).toBeNull();
      expect(formatShortDate('2026-07-02T10:00:00.000Z')).toBeTruthy();
    });

    it('toRewards keeps only completed referrals', () => {
      const rewards = toRewards(HISTORY);
      expect(rewards).toHaveLength(1);
      expect(rewards[0].xp).toBe(50);
    });

    it('toRewards handles undefined history', () => {
      expect(toRewards(undefined)).toEqual([]);
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
      expect(screen.getByLabelText('Loading rewards')).toBeTruthy();
    });

    it('renders real total XP and referral stats', async () => {
      await renderScreen();
      await waitFor(() =>
        expect(screen.getByLabelText(/1,240 total XP earned, 50 of it from referrals/)).toBeTruthy(),
      );
      expect(screen.getByText('+50 XP')).toBeTruthy();
    });

    it('shows the empty history message when no completed referrals', async () => {
      mockGetHistory.mockResolvedValue({ ...HISTORY, items: [] });
      await renderScreen();
      await waitFor(() => expect(screen.getByText(/No referral rewards yet/)).toBeTruthy());
    });

    it('renders the error state and retries', async () => {
      mockGetMe.mockRejectedValue(new Error('offline'));
      await renderScreen();
      await waitFor(() => expect(screen.getByText("Couldn't load rewards")).toBeTruthy());
      mockGetMe.mockResolvedValue(ME);
      fireEvent.press(screen.getByLabelText('Try again'));
      await waitFor(() =>
        expect(screen.getByLabelText(/1,240 total XP earned/)).toBeTruthy(),
      );
    });
  });

  describe('interactions', () => {
    it('shares the real invite url', async () => {
      const { onShareInvite } = await renderScreen();
      await waitFor(() => expect(screen.getByLabelText(/Share your invite link, code H7KMNP34/)).toBeTruthy());
      fireEvent.press(screen.getByLabelText(/Share your invite link, code H7KMNP34/));
      expect(onShareInvite).toHaveBeenCalledWith('sidequest://referrals/invite/H7KMNP34');
    });

    it('invokes onBack from the header', async () => {
      const { onBack } = await renderScreen();
      fireEvent.press(screen.getByLabelText('Back to profile'));
      expect(onBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('accessibility', () => {
    it('gives every button a label', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByLabelText(/Share your invite link/)).toBeTruthy());
      screen.getAllByRole('button').forEach((b) => {
        expect(b.props.accessibilityLabel).toBeTruthy();
      });
    });
  });
});
