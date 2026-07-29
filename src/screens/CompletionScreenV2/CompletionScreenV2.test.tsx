import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';

import * as Haptics from 'expo-haptics';
import CompletionScreenV2, { computeLevel, formatStreak } from './CompletionScreenV2';
import type { ProofSubmissionResponse } from '../../types/api';

jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(() => Promise.resolve()),
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
    withSequence: (...vs: unknown[]) => vs[vs.length - 1],
  };
});

const RESULT: ProofSubmissionResponse = {
  completionId: 'c-1',
  missionTitle: 'Street Type Safari',
  xpAwarded: 40,
  totalXp: 680,
  currentStreak: 13,
  longestStreak: 13,
  proofUrl: null,
};

async function renderScreen(overrides: Partial<React.ComponentProps<typeof CompletionScreenV2>> = {}) {
  const props = {
    result: RESULT,
    isGuest: false,
    onBackToToday: jest.fn(),
    onShare: jest.fn(),
    onCreateAccount: jest.fn(),
    onOpenNextIdea: jest.fn(),
    ...overrides,
  };
  const result = await render(<CompletionScreenV2 {...props} />);
  return { ...props, ...result };
}

describe('CompletionScreenV2', () => {
  beforeEach(() => jest.clearAllMocks());
  afterEach(() => cleanup());

  describe('rendering', () => {
    it('renders the completion header, XP, level and streak', async () => {
      await renderScreen();
      expect(screen.getByRole('header', { name: 'Quest complete' })).toBeTruthy();
      expect(screen.getByLabelText('40 XP earned')).toBeTruthy();
      expect(screen.getByText('+40 XP')).toBeTruthy();
      expect(screen.getByText('Level 7')).toBeTruthy();
      expect(screen.getByText('13-day streak')).toBeTruthy();
    });

    it('fires a success haptic on mount', async () => {
      await renderScreen();
      expect(Haptics.notificationAsync).toHaveBeenCalledWith('success');
    });

    it('renders fine even when the success haptic rejects', async () => {
      (Haptics.notificationAsync as jest.Mock).mockRejectedValueOnce(new Error('no haptics'));
      await renderScreen();
      expect(screen.getByRole('header', { name: 'Quest complete' })).toBeTruthy();
    });

    it('hides the guest card for a signed-in user', async () => {
      await renderScreen({ isGuest: false });
      expect(screen.queryByLabelText('Create a free account')).toBeNull();
    });

    it('shows the guest card for a guest', async () => {
      await renderScreen({ isGuest: true });
      expect(screen.getByLabelText('Create a free account')).toBeTruthy();
    });

  });

  describe('interactions', () => {
    it('calls onBackToToday and onShare from the sticky CTAs', async () => {
      const { onBackToToday, onShare } = await renderScreen();
      await fireEvent.press(screen.getByLabelText('Back to Today'));
      await fireEvent.press(screen.getByLabelText('Share this moment'));
      expect(onBackToToday).toHaveBeenCalledTimes(1);
      expect(onShare).toHaveBeenCalledTimes(1);
      // onShare receives a ref to the capturable celebration card (for the
      // view-shot image share the route performs).
      const ref = (onShare as jest.Mock).mock.calls[0][0];
      expect(ref).toHaveProperty('current');
    });

    it('calls onOpenNextIdea from the next-idea card', async () => {
      const { onOpenNextIdea } = await renderScreen();
      await fireEvent.press(screen.getByLabelText(/Next idea:/));
      expect(onOpenNextIdea).toHaveBeenCalledTimes(1);
    });

    it('calls onCreateAccount from the guest card', async () => {
      const { onCreateAccount } = await renderScreen({ isGuest: true });
      await fireEvent.press(screen.getByLabelText('Create a free account'));
      expect(onCreateAccount).toHaveBeenCalledTimes(1);
    });
  });

  describe('accessibility', () => {
    it('gives every interactive element a button role and a label', async () => {
      await renderScreen({ isGuest: true });
      screen.getAllByRole('button').forEach((btn) => {
        expect(btn.props.accessibilityLabel).toBeTruthy();
      });
    });
  });

  describe('pure helpers', () => {
    it('computeLevel derives level/xp from the flat 100-XP curve', () => {
      expect(computeLevel(680)).toEqual({ level: 7, xpIntoLevel: 80, xpToNextLevel: 20, progress: 80 });
      expect(computeLevel(0)).toEqual({ level: 1, xpIntoLevel: 0, xpToNextLevel: 100, progress: 0 });
      expect(computeLevel(-5)).toEqual({ level: 1, xpIntoLevel: 0, xpToNextLevel: 100, progress: 0 });
    });

    it('formatStreak renders the compound-adjective label', () => {
      expect(formatStreak(13)).toBe('13-day streak');
      expect(formatStreak(0)).toBe('0-day streak');
    });
  });
});
