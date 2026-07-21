import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';

import * as Haptics from 'expo-haptics';
import QuestDetailScreen, { buildCriteria, heroGlyph } from './QuestDetailScreen';
import type { Mission } from '../../types/api';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
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
  };
});

jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return { LinearGradient: View };
});

const MISSION: Mission = {
  id: 'm-1',
  category: 'explore',
  title: 'Street Type Safari',
  desc: 'short',
  full: 'Find and capture three unique letters you see in the wild.',
  proof: 'A clear photo of each letter found in a public place',
  time: '30 min',
  xp: '20 XP',
  diff: 'Easy',
  dots: 1,
};

async function renderScreen(overrides: Partial<React.ComponentProps<typeof QuestDetailScreen>> = {}) {
  const props = { mission: MISSION, onBack: jest.fn(), onShare: jest.fn(), onAccept: jest.fn(), onRetry: jest.fn(), ...overrides };
  const result = await render(<QuestDetailScreen {...props} />);
  return { ...props, ...result };
}

describe('QuestDetailScreen', () => {
  beforeEach(() => jest.clearAllMocks());
  afterEach(() => cleanup());

  describe('rendering', () => {
    it('renders the mission title, brief, stats and proof requirement', async () => {
      await renderScreen();
      expect(screen.getByRole('header', { name: 'Street Type Safari' })).toBeTruthy();
      expect(screen.getByText('Find and capture three unique letters you see in the wild.')).toBeTruthy();
      expect(screen.getByText('Photo proof')).toBeTruthy();
      expect(screen.getByLabelText('Accept quest')).toBeTruthy();
    });

    it('renders the What counts criteria including the proof requirement', async () => {
      await renderScreen();
      expect(screen.getByText('A clear photo of each letter found in a public place')).toBeTruthy();
    });

    it('renders the loading skeleton when isLoading', async () => {
      await renderScreen({ isLoading: true });
      expect(screen.getByLabelText('Loading quest')).toBeTruthy();
      expect(screen.queryByLabelText('Accept quest')).toBeNull();
    });

    it('renders the unavailable state when no mission is supplied', async () => {
      await renderScreen({ mission: undefined });
      expect(screen.getByRole('header', { name: 'Quest unavailable' })).toBeTruthy();
    });
  });

  describe('interactions', () => {
    it('calls onBack and onShare', async () => {
      const { onBack, onShare } = await renderScreen();
      await fireEvent.press(screen.getByLabelText('Back to results'));
      await fireEvent.press(screen.getByLabelText('Share quest link'));
      expect(onBack).toHaveBeenCalledTimes(1);
      expect(onShare).toHaveBeenCalledTimes(1);
    });

    it('accepts the quest with haptics and press-scale, then locks the button', async () => {
      const { onAccept } = await renderScreen();
      const cta = screen.getByLabelText('Accept quest');
      await fireEvent(cta, 'pressIn');
      await fireEvent(cta, 'pressOut');
      await fireEvent.press(cta);
      expect(Haptics.impactAsync).toHaveBeenCalledWith('medium');
      expect(onAccept).toHaveBeenCalledWith(MISSION);
      expect(screen.getByLabelText('Quest accepted')).toBeTruthy();
    });

    it('ignores repeated presses once accepted', async () => {
      const { onAccept } = await renderScreen();
      await fireEvent.press(screen.getByLabelText('Accept quest'));
      await fireEvent.press(screen.getByLabelText('Quest accepted'));
      expect(onAccept).toHaveBeenCalledTimes(1);
    });

    it('calls onRetry from the unavailable state', async () => {
      const { onRetry } = await renderScreen({ mission: undefined });
      await fireEvent.press(screen.getByLabelText('Try again'));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('falls back to onBack when the unavailable retry has no onRetry', async () => {
      const { onBack } = await renderScreen({ mission: undefined, onRetry: undefined });
      await fireEvent.press(screen.getByLabelText('Try again'));
      expect(onBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('accessibility', () => {
    it('gives every interactive element a button role and a label', async () => {
      await renderScreen();
      screen.getAllByRole('button').forEach((btn) => {
        expect(btn.props.accessibilityLabel).toBeTruthy();
      });
    });
  });

  describe('pure helpers', () => {
    it('heroGlyph builds two-letter initials with a fallback', () => {
      expect(heroGlyph('Street Type Safari')).toBe('SS');
      expect(heroGlyph('Reset')).toBe('RE');
      expect(heroGlyph('   ')).toBe('SQ');
    });

    it('buildCriteria surfaces the proof requirement first', () => {
      const criteria = buildCriteria(MISSION);
      expect(criteria[0]).toBe(MISSION.proof);
      expect(criteria.length).toBe(3);
    });
  });
});
