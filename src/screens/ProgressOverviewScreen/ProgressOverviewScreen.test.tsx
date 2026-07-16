import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProgressOverviewScreen, { whenPressed } from './ProgressOverviewScreen';
import { getHome } from '../../services/homeApi';
import { getUnreadCount } from '../../services/notificationsApi';
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
jest.mock('../../services/notificationsApi');

const mockGetHome = getHome as jest.MockedFunction<typeof getHome>;
const mockGetUnreadCount = getUnreadCount as jest.MockedFunction<typeof getUnreadCount>;

const HOME: HomeResponse = {
  level: { level: 7, xpIntoLevel: 70, xpToNextLevel: 30, totalXp: 720 },
  streak: { currentStreak: 12, longestStreak: 20 },
  dailyMission: null,
  pendingChallenges: [],
  savedPacks: [],
  taskStats: { total: 60, approved: 48, pending: 8, rejected: 4, completionRate: 0.8 },
};

const EMPTY_HOME: HomeResponse = {
  ...HOME,
  streak: { currentStreak: 0, longestStreak: 0 },
  level: { level: 0, xpIntoLevel: 0, xpToNextLevel: 100, totalXp: 0 },
  taskStats: { total: 0, approved: 0, pending: 0, rejected: 0, completionRate: 0 },
};

type Handlers = Partial<React.ComponentProps<typeof ProgressOverviewScreen>>;

async function renderScreen(overrides: Handlers = {}) {
  const handlers: Required<Handlers> = {
    onOpenLevelDetail: jest.fn(),
    onOpenXpDetail: jest.fn(),
    onOpenStreakDetail: jest.fn(),
    onOpenAchievements: jest.fn(),
    onOpenAchievement: jest.fn(),
    onOpenStatistics: jest.fn(),
    onOpenNotifications: jest.fn(),
    ...overrides,
  } as Required<Handlers>;
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const utils = await render(
    <QueryClientProvider client={queryClient}>
      <ProgressOverviewScreen {...handlers} />
    </QueryClientProvider>,
  );
  return { ...utils, handlers };
}

describe('ProgressOverviewScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetHome.mockResolvedValue(HOME);
    mockGetUnreadCount.mockResolvedValue({ unreadCount: 0 });
  });

  describe('rendering', () => {
    it('renders the loading skeleton first', async () => {
      mockGetHome.mockReturnValue(new Promise(() => {}));
      await renderScreen();
      expect(screen.getByLabelText('Loading your progress')).toBeTruthy();
    });

    it('renders level, rank and XP once loaded', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByText('Trailblazer')).toBeTruthy());
      expect(screen.getByText('Level 7')).toBeTruthy();
      expect(screen.getByText('720 XP')).toBeTruthy();
      expect(screen.getByText('80%')).toBeTruthy();
    });

    it('renders the derived achievements strip', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByText('First Steps')).toBeTruthy());
      expect(screen.getByText(/See all \(8\)/)).toBeTruthy();
    });

    it('renders the verification breakdown from real stats', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByLabelText(/Approved: 48 quests\. Counted toward XP/)).toBeTruthy());
      expect(screen.getByLabelText(/Under review: 8 quests\. Awaiting proof check/)).toBeTruthy();
      expect(screen.getByLabelText(/Rejected: 4 quests\. Proof did not pass/)).toBeTruthy();
    });

    it('renders the empty verification card when nothing is logged', async () => {
      mockGetHome.mockResolvedValue(EMPTY_HOME);
      await renderScreen();
      await waitFor(() => expect(screen.getByText('No quests logged yet')).toBeTruthy());
    });

    it('renders the error state and retries on press', async () => {
      mockGetHome.mockRejectedValue(new Error('offline'));
      await renderScreen();
      await waitFor(() => expect(screen.getByText("Couldn't load progress")).toBeTruthy());
      mockGetHome.mockResolvedValue(HOME);
      fireEvent.press(screen.getByLabelText('Try again'));
      await waitFor(() => expect(screen.getByText('Trailblazer')).toBeTruthy());
    });
  });

  describe('interactions', () => {
    it('opens level detail from the level header', async () => {
      const { handlers } = await renderScreen();
      await waitFor(() => expect(screen.getByText('Trailblazer')).toBeTruthy());
      fireEvent.press(screen.getByLabelText(/Level 7, Trailblazer/));
      expect(handlers.onOpenLevelDetail).toHaveBeenCalledTimes(1);
    });

    it('opens XP detail from the XP row', async () => {
      const { handlers } = await renderScreen();
      await waitFor(() => expect(screen.getByText('720 XP')).toBeTruthy());
      fireEvent.press(screen.getByLabelText(/Experience: 720 total XP/));
      expect(handlers.onOpenXpDetail).toHaveBeenCalledTimes(1);
    });

    it('opens streak detail from the streak tile', async () => {
      const { handlers } = await renderScreen();
      await waitFor(() => expect(screen.getByLabelText(/Streak: 12 day streak/)).toBeTruthy());
      fireEvent.press(screen.getByLabelText(/Streak: 12 day streak/));
      expect(handlers.onOpenStreakDetail).toHaveBeenCalled();
    });

    it('opens statistics from a stat tile', async () => {
      const { handlers } = await renderScreen();
      await waitFor(() => expect(screen.getByLabelText(/Approved: 48 quests all-time/)).toBeTruthy());
      fireEvent.press(screen.getByLabelText(/Approved: 48 quests all-time/));
      expect(handlers.onOpenStatistics).toHaveBeenCalled();
    });

    it('opens the achievements grid from See all', async () => {
      const { handlers } = await renderScreen();
      await waitFor(() => expect(screen.getByLabelText(/See all achievements/)).toBeTruthy());
      fireEvent.press(screen.getByLabelText(/See all achievements/));
      expect(handlers.onOpenAchievements).toHaveBeenCalledTimes(1);
    });

    it('opens a single achievement detail', async () => {
      const { handlers } = await renderScreen();
      await waitFor(() => expect(screen.getByLabelText(/First Steps achievement/)).toBeTruthy());
      fireEvent.press(screen.getByLabelText(/First Steps achievement/));
      expect(handlers.onOpenAchievement).toHaveBeenCalledWith('first-steps');
    });

    it('opens statistics from the verification Statistics link', async () => {
      const { handlers } = await renderScreen();
      await waitFor(() => expect(screen.getByLabelText('View full statistics')).toBeTruthy());
      fireEvent.press(screen.getByLabelText('View full statistics'));
      expect(handlers.onOpenStatistics).toHaveBeenCalled();
    });

    it('opens notifications from the bell', async () => {
      const { handlers } = await renderScreen();
      await waitFor(() => expect(screen.getByLabelText('Open notifications')).toBeTruthy());
      fireEvent.press(screen.getByLabelText('Open notifications'));
      expect(handlers.onOpenNotifications).toHaveBeenCalledTimes(1);
    });

    it('shows the unread count on the bell when there are unread notifications', async () => {
      mockGetUnreadCount.mockResolvedValue({ unreadCount: 4 });
      await renderScreen();
      await waitFor(() => expect(screen.getByLabelText('Notifications, 4 unread')).toBeTruthy());
      expect(screen.queryByLabelText('Open notifications')).toBeNull();
    });
  });

  describe('accessibility', () => {
    it('gives every interactive Pressable a role and label', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByText('Trailblazer')).toBeTruthy());
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      buttons.forEach((b) => {
        expect(b.props.accessibilityLabel).toBeTruthy();
      });
    });
  });

  describe('whenPressed', () => {
    it('returns the style only while pressed', () => {
      const s = { opacity: 0.5 };
      expect(whenPressed(true, s)).toBe(s);
      expect(whenPressed(false, s)).toBeNull();
    });
  });
});
