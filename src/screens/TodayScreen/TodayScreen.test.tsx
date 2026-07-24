import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import * as Haptics from 'expo-haptics';
import TodayScreen, { avatarInitial, computeGoalProgress } from './TodayScreen';
import { getHome } from '../../services/homeApi';
import { getUnreadCount } from '../../services/notificationsApi';
import type { HomeResponse } from '../../types/api';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success' },
}));

jest.mock('react-native-reanimated', () => {
  const R = require('react');
  const { View, Text, ScrollView } = require('react-native');
  const pass = (Comp: unknown) =>
    R.forwardRef((props: Record<string, unknown>, ref: unknown) => {
      const { entering, exiting, layout, ...rest } = props;
      return R.createElement(Comp, { ...rest, ref });
    });
  const chain = (): unknown =>
    new Proxy(function () {}, { get: () => chain(), apply: () => chain() });
  return {
    __esModule: true,
    default: { View: pass(View), Text: pass(Text), ScrollView: pass(ScrollView), createAnimatedComponent: pass },
    FadeInDown: chain(),
    useSharedValue: (v: unknown) => ({ value: v }),
    useAnimatedStyle: (fn: () => unknown) => (typeof fn === 'function' ? fn() : {}),
    withSpring: (v: unknown) => v,
    withTiming: (v: unknown) => v,
  };
});

jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return { LinearGradient: View };
});

jest.mock('../../services/homeApi');
jest.mock('../../services/notificationsApi');

const mockGetHome = getHome as jest.Mock;
const mockGetUnreadCount = getUnreadCount as jest.Mock;

const HOME: HomeResponse = {
  level: { level: 7, xpIntoLevel: 40, xpToNextLevel: 60, totalXp: 640 },
  streak: { currentStreak: 12, longestStreak: 13 },
  dailyMission: null,
  pendingChallenges: [],
  savedPacks: [],
  taskStats: { total: 4, approved: 2, pending: 1, rejected: 1, completionRate: 0.5 },
};

async function renderScreen(overrides: Partial<React.ComponentProps<typeof TodayScreen>> = {}) {
  const props = {
    onOpenNotifications: jest.fn(),
    onOpenProfile: jest.fn(),
    onGetInspired: jest.fn(),
    onOpenExplore: jest.fn(),
    onOpenPendingProof: jest.fn(),
    ...overrides,
  };
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const result = await render(
    <QueryClientProvider client={queryClient}>
      <TodayScreen {...props} />
    </QueryClientProvider>,
  );
  return { ...props, ...result };
}

describe('TodayScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetHome.mockResolvedValue(HOME);
    mockGetUnreadCount.mockResolvedValue({ unreadCount: 2 });
  });

  afterEach(() => {
    cleanup();
  });

  describe('rendering', () => {
    it('renders the header and daily-spark hero once loaded', async () => {
      await renderScreen();
      expect(screen.getByRole('header', { name: 'Today' })).toBeTruthy();
      await waitFor(() => expect(screen.getByLabelText('Get inspired')).toBeTruthy());
      expect(screen.getByText('One small step.\nBig ripple.')).toBeTruthy();
    });

    it('uses the daily mission title in the hero when the pool has one', async () => {
      mockGetHome.mockResolvedValue({
        ...HOME,
        dailyMission: {
          id: 'm-1',
          category: 'explore',
          title: 'Street Type Safari',
          desc: 'Hunt three letters in the wild.',
          full: 'x',
          proof: 'x',
          time: '30 min',
          xp: '20 XP',
          diff: 'Easy',
          dots: 1,
        },
      });
      await renderScreen();
      await waitFor(() => expect(screen.getByText('Street Type Safari')).toBeTruthy());
      expect(screen.getByText('Hunt three letters in the wild.')).toBeTruthy();
    });

    it('renders the loading skeleton before data arrives', async () => {
      mockGetHome.mockReturnValue(new Promise(() => {}));
      await renderScreen();
      expect(screen.getByLabelText('Loading your day')).toBeTruthy();
    });

    it('renders the error state when the request fails', async () => {
      mockGetHome.mockRejectedValue(new Error('offline'));
      await renderScreen();
      await waitFor(() => expect(screen.getByText("Couldn't load Today")).toBeTruthy());
    });

    it('shows the pending-proof card when there are pending completions', async () => {
      await renderScreen();
      await waitFor(() =>
        expect(screen.getByLabelText(/1 proof awaiting review/)).toBeTruthy(),
      );
    });

    it('hides the pending-proof card when nothing is pending', async () => {
      mockGetHome.mockResolvedValue({
        ...HOME,
        taskStats: { ...HOME.taskStats, pending: 0 },
      });
      await renderScreen();
      await waitFor(() => expect(screen.getByLabelText('Get inspired')).toBeTruthy());
      expect(screen.queryByText('Continue your story')).toBeNull();
    });

    it('uses the supplied weekly goal in the progress label', async () => {
      await renderScreen({ weeklyGoal: { completed: 1, target: 4 } });
      await waitFor(() => expect(screen.getByText('1 of 4 quests')).toBeTruthy());
    });
  });

  describe('interactions', () => {
    it('fires haptics, runs press-scale handlers, and calls onGetInspired', async () => {
      const { onGetInspired } = await renderScreen();
      await waitFor(() => expect(screen.getByLabelText('Get inspired')).toBeTruthy());
      const cta = screen.getByLabelText('Get inspired');
      // Exercise usePressScale's spring handlers (must not throw).
      await fireEvent(cta, 'pressIn');
      await fireEvent(cta, 'pressOut');
      await fireEvent.press(cta);
      expect(Haptics.impactAsync).toHaveBeenCalledWith('light');
      expect(onGetInspired).toHaveBeenCalledTimes(1);
    });

    it('shows the profile photo instead of the initial when avatarUrl is set', async () => {
      await renderScreen({ displayName: 'Ada', avatarUrl: 'https://cdn.example.test/avatar.jpg' });
      const image = await screen.findByTestId('today-avatar-image', { includeHiddenElements: true });
      expect(image.props.source).toEqual({ uri: 'https://cdn.example.test/avatar.jpg' });
      expect(screen.queryByText('A')).toBeNull();
    });

    it('falls back to the initial when no avatarUrl is set', async () => {
      await renderScreen({ displayName: 'Ada', avatarUrl: null });
      await waitFor(() => expect(screen.getByText('A')).toBeTruthy());
    });

    it('calls onOpenNotifications and onOpenProfile from the header', async () => {
      const { onOpenNotifications, onOpenProfile } = await renderScreen();
      await waitFor(() => expect(screen.getByLabelText('Notifications, 2 unread')).toBeTruthy());
      await fireEvent.press(screen.getByLabelText('Notifications, 2 unread'));
      await fireEvent.press(screen.getByLabelText('Open your profile'));
      expect(onOpenNotifications).toHaveBeenCalledTimes(1);
      expect(onOpenProfile).toHaveBeenCalledTimes(1);
      await waitFor(() => expect(mockGetHome).toHaveBeenCalled());
    });

    it('shows no unread badge/count when there are no unread notifications', async () => {
      mockGetUnreadCount.mockResolvedValue({ unreadCount: 0 });
      await renderScreen();
      await waitFor(() => expect(screen.getByLabelText('Notifications')).toBeTruthy());
      expect(screen.queryByLabelText(/Notifications, \d+ unread/)).toBeNull();
    });

    it('shows the actual unread count on the bell badge, not just a dot', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByLabelText('Notifications, 2 unread')).toBeTruthy());
      // The badge digit is accessibilityElementsHidden (decorative — the real
      // announcement is the button's own "2 unread" label above), so it must
      // be queried with includeHiddenElements to be found at all.
      expect(screen.getByText('2', { includeHiddenElements: true })).toBeTruthy();
    });

    it('caps the bell badge at "9+" for double-digit unread counts', async () => {
      mockGetUnreadCount.mockResolvedValue({ unreadCount: 42 });
      await renderScreen();
      await waitFor(() => expect(screen.getByLabelText('Notifications, 42 unread')).toBeTruthy());
      expect(screen.getByText('9+', { includeHiddenElements: true })).toBeTruthy();
    });

    it('calls onOpenExplore from the explore row', async () => {
      const { onOpenExplore } = await renderScreen();
      await waitFor(() => expect(screen.getByLabelText(/Explore more quests/)).toBeTruthy());
      await fireEvent.press(screen.getByLabelText(/Explore more quests/));
      expect(onOpenExplore).toHaveBeenCalledTimes(1);
    });

    it('calls onOpenPendingProof from the story card', async () => {
      const { onOpenPendingProof } = await renderScreen();
      await waitFor(() => expect(screen.getByLabelText(/proof awaiting review/)).toBeTruthy());
      await fireEvent.press(screen.getByLabelText(/proof awaiting review/));
      expect(onOpenPendingProof).toHaveBeenCalledTimes(1);
    });

    it('retries the query when Try again is pressed', async () => {
      mockGetHome.mockRejectedValueOnce(new Error('offline'));
      await renderScreen();
      await waitFor(() => expect(screen.getByText("Couldn't load Today")).toBeTruthy());
      mockGetHome.mockResolvedValueOnce(HOME);
      await fireEvent.press(screen.getByLabelText('Try again'));
      await waitFor(() => expect(screen.getByLabelText('Get inspired')).toBeTruthy());
    });
  });

  describe('accessibility', () => {
    it('gives every interactive element a button role and a label', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByLabelText('Get inspired')).toBeTruthy());
      screen.getAllByRole('button').forEach((btn) => {
        expect(btn.props.accessibilityLabel).toBeTruthy();
      });
    });
  });

  describe('Halcyon+ iconography', () => {
    it('renders the bell, spark, flame and chevron vector icons', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByLabelText('Get inspired')).toBeTruthy());
      // Decorative icons are hidden from assistive tech, so query with
      // includeHiddenElements. Their presence proves the emoji glyphs were
      // swapped for the shared Icon component.
      expect(screen.getByTestId('today-bell-icon', { includeHiddenElements: true })).toBeTruthy();
      expect(screen.getByTestId('today-spark-icon', { includeHiddenElements: true })).toBeTruthy();
      expect(screen.getByTestId('today-streak-flame', { includeHiddenElements: true })).toBeTruthy();
      expect(screen.getByTestId('today-explore-chevron', { includeHiddenElements: true })).toBeTruthy();
    });
  });

  describe('pure helpers', () => {
    it('computeGoalProgress clamps and guards zero targets', () => {
      expect(computeGoalProgress({ completed: 3, target: 5 })).toBe(60);
      expect(computeGoalProgress({ completed: 9, target: 5 })).toBe(100);
      expect(computeGoalProgress({ completed: 1, target: 0 })).toBe(0);
    });

    it('avatarInitial returns an uppercase initial or a fallback glyph', () => {
      expect(avatarInitial('nadia')).toBe('N');
      expect(avatarInitial('  omar')).toBe('O');
      expect(avatarInitial('')).toBe('★');
      expect(avatarInitial(null)).toBe('★');
      expect(avatarInitial(undefined)).toBe('★');
    });
  });
});
