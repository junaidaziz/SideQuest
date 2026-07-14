import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AchievementDetailScreen, { statusCopy, whenPressed } from './AchievementDetailScreen';
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
  level: { level: 2, xpIntoLevel: 30, xpToNextLevel: 70, totalXp: 130 },
  streak: { currentStreak: 3, longestStreak: 5 },
  dailyMission: null,
  pendingChallenges: [],
  savedPacks: [],
  taskStats: { total: 8, approved: 6, pending: 1, rejected: 1, completionRate: 0.75 },
};

async function renderScreen(overrides: Partial<React.ComponentProps<typeof AchievementDetailScreen>> = {}) {
  const onBack = jest.fn();
  const onShare = jest.fn();
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const utils = await render(
    <QueryClientProvider client={queryClient}>
      <AchievementDetailScreen achievementId="first-steps" onBack={onBack} onShare={onShare} {...overrides} />
    </QueryClientProvider>,
  );
  return { ...utils, onBack, onShare };
}

describe('AchievementDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetHome.mockResolvedValue(HOME);
  });

  describe('rendering', () => {
    it('shows the loading skeleton first', async () => {
      mockGetHome.mockReturnValue(new Promise(() => {}));
      await renderScreen();
      expect(screen.getByLabelText('Loading achievement')).toBeTruthy();
    });

    it('renders the earned achievement with its rule and share preview', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByText('First Steps')).toBeTruthy());
      expect(screen.getByText('Earned')).toBeTruthy();
      expect(screen.getByText('How to unlock')).toBeTruthy();
      expect(screen.getByText('I earned First Steps on SideQuest')).toBeTruthy();
    });

    it('renders a locked achievement with a disabled share CTA', async () => {
      await renderScreen({ achievementId: 'quest-master' });
      await waitFor(() => expect(screen.getByText('Quest Master')).toBeTruthy());
      const cta = screen.getByLabelText('Quest Master not earned yet');
      expect(cta.props.accessibilityState).toEqual(expect.objectContaining({ disabled: true }));
    });

    it('renders a not-found state for an unknown id', async () => {
      await renderScreen({ achievementId: 'does-not-exist' });
      await waitFor(() => expect(screen.getByText('Achievement not found')).toBeTruthy());
    });

    it('renders the error state and retries', async () => {
      mockGetHome.mockRejectedValue(new Error('offline'));
      await renderScreen();
      await waitFor(() => expect(screen.getByText("Couldn't load achievement")).toBeTruthy());
      mockGetHome.mockResolvedValue(HOME);
      fireEvent.press(screen.getByLabelText('Try again'));
      await waitFor(() => expect(screen.getByText('First Steps')).toBeTruthy());
    });
  });

  describe('interactions', () => {
    it('shares an earned achievement from the body CTA', async () => {
      const { onShare } = await renderScreen();
      await waitFor(() => expect(screen.getByLabelText('Share First Steps')).toBeTruthy());
      fireEvent.press(screen.getByLabelText('Share First Steps'));
      expect(onShare).toHaveBeenCalledWith('first-steps');
    });

    it('shares from the header share button', async () => {
      const { onShare } = await renderScreen();
      await waitFor(() => expect(screen.getByText('First Steps')).toBeTruthy());
      fireEvent.press(screen.getByLabelText('Share achievement'));
      expect(onShare).toHaveBeenCalledWith('first-steps');
    });

    it('invokes onBack from the header', async () => {
      const { onBack } = await renderScreen();
      fireEvent.press(screen.getByLabelText('Back to achievements'));
      expect(onBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('statusCopy', () => {
    it('maps status to pill copy', () => {
      expect(
        statusCopy({ id: 'x', name: 'x', icon: 'x', tint: 'teal', description: 'x', progress: 1, unlocked: true, progressLabel: '1 / 1' }),
      ).toBe('Earned');
      expect(
        statusCopy({ id: 'x', name: 'x', icon: 'x', tint: 'teal', description: 'x', progress: 0.5, unlocked: false, progressLabel: '1 / 2' }),
      ).toBe('In progress');
      expect(
        statusCopy({ id: 'x', name: 'x', icon: 'x', tint: 'teal', description: 'x', progress: 0, unlocked: false, progressLabel: '0 / 2' }),
      ).toBe('Locked');
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
