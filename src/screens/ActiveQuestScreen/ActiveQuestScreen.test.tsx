import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';

import ActiveQuestScreen, { stepCountLabel, stepProgress, type QuestStep } from './ActiveQuestScreen';
import type { Mission } from '../../types/api';

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

const MISSION: Mission = {
  id: 'm-1',
  category: 'explore',
  title: 'Street Type Safari',
  desc: 'short',
  full: 'full',
  proof: 'Three photos, one per letter',
  time: '30 min',
  xp: '20 XP',
  diff: 'Easy',
  dots: 1,
};

const STEPS: QuestStep[] = [
  { id: 's1', label: 'Letter one', done: true },
  { id: 's2', label: 'Letter two', done: true },
  { id: 's3', label: 'Letter three', done: false },
];

async function renderScreen(overrides: Partial<React.ComponentProps<typeof ActiveQuestScreen>> = {}) {
  const props = {
    mission: MISSION,
    steps: STEPS,
    elapsedLabel: '18:24',
    onBack: jest.fn(),
    onOptions: jest.fn(),
    onReadyToFinish: jest.fn(),
    onRetry: jest.fn(),
    ...overrides,
  };
  const result = await render(<ActiveQuestScreen {...props} />);
  return { ...props, ...result };
}

describe('ActiveQuestScreen', () => {
  beforeEach(() => jest.clearAllMocks());
  afterEach(() => cleanup());

  describe('rendering', () => {
    it('renders the mission title, elapsed time, checklist and proof requirement', async () => {
      await renderScreen();
      expect(screen.getByText('Street Type Safari')).toBeTruthy();
      expect(screen.getByText('18:24')).toBeTruthy();
      expect(screen.getByText('2 / 3')).toBeTruthy();
      expect(screen.getByText('Three photos, one per letter')).toBeTruthy();
      expect(screen.getByLabelText("I'm ready to finish")).toBeTruthy();
    });

    it('renders the loading skeleton when isLoading', async () => {
      await renderScreen({ isLoading: true });
      expect(screen.getByLabelText('Loading active quest')).toBeTruthy();
      expect(screen.queryByLabelText("I'm ready to finish")).toBeNull();
    });

    it('renders the no-active-quest state when no mission is supplied', async () => {
      await renderScreen({ mission: undefined });
      expect(screen.getByRole('header', { name: 'No active quest' })).toBeTruthy();
    });

    it('shows an all-done instruction when every step is complete (edge case)', async () => {
      await renderScreen({ steps: STEPS.map((s) => ({ ...s, done: true })) });
      expect(screen.getByText(/ready to submit your proof/)).toBeTruthy();
      expect(screen.getByText('3 / 3')).toBeTruthy();
    });
  });

  describe('interactions', () => {
    it('calls onBack and onOptions', async () => {
      const { onBack, onOptions } = await renderScreen();
      await fireEvent.press(screen.getByLabelText('Back to Today'));
      await fireEvent.press(screen.getByLabelText('Quest options: pause or abandon'));
      expect(onBack).toHaveBeenCalledTimes(1);
      expect(onOptions).toHaveBeenCalledTimes(1);
    });

    it('runs the press-scale handlers and calls onReadyToFinish once', async () => {
      const { onReadyToFinish } = await renderScreen();
      const cta = screen.getByLabelText("I'm ready to finish");
      await fireEvent(cta, 'pressIn');
      await fireEvent(cta, 'pressOut');
      await fireEvent.press(cta);
      await fireEvent.press(cta);
      expect(onReadyToFinish).toHaveBeenCalledWith(MISSION);
      expect(onReadyToFinish).toHaveBeenCalledTimes(1);
    });

    it('calls onRetry from the no-active-quest state', async () => {
      const { onRetry } = await renderScreen({ mission: undefined });
      await fireEvent.press(screen.getByLabelText('Go back to Today'));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('falls back to onBack when the empty-state button has no onRetry', async () => {
      const { onBack } = await renderScreen({ mission: undefined, onRetry: undefined });
      await fireEvent.press(screen.getByLabelText('Go back to Today'));
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
    it('stepProgress computes done/total percentage and guards empty', () => {
      expect(stepProgress(STEPS)).toBeCloseTo(66.66, 1);
      expect(stepProgress([])).toBe(0);
    });

    it('stepCountLabel renders the done/total count', () => {
      expect(stepCountLabel(STEPS)).toBe('2 / 3');
    });
  });
});
